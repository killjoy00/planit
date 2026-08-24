import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendJoinVerification } from "@/lib/email"
import { creatorDisplayName } from "@/lib/display-name"

const schema = z.object({
  // Trimmed before validating, not after: a pasted address routinely carries
  // trailing whitespace, and rejecting it here reads to the sender as "this
  // site says my email is invalid".
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
})

/** A share link is public, so a poll cannot grow without bound through it. */
const MAX_PEOPLE_PER_POLL = 300

/** How long a verification link stays good. */
const EXPIRY_MS = 24 * 60 * 60 * 1000

/**
 * One address may be mailed again only this often. Without it, anyone holding
 * the share link could resubmit someone else's address in a loop and use this
 * form to bombard them — the fastest way there is to ruin a sending domain.
 */
const RESEND_COOLDOWN_MS = 60 * 1000

export async function POST(req: NextRequest, { params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params

  const poll = await db.poll.findUnique({
    where: { shareToken },
    include: { creator: { select: { name: true, email: true } } },
  })
  if (!poll) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 })
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "This poll is closed." }, { status: 400 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter your name and a valid email." }, { status: 400 })
  }

  const { name, email } = parsed.data

  // Already on the poll: hand back their own link rather than making a second
  // participant for the same person with a second ballot.
  const existing = await db.participant.findUnique({
    where: { pollId_email: { pollId: poll.id, email } },
    select: { votedAt: true, optedOut: true },
  })
  if (existing) {
    if (existing.optedOut) {
      return NextResponse.json({ error: "You opted out of this poll." }, { status: 400 })
    }
    return NextResponse.json({
      status: existing.votedAt ? "already_voted" : "already_invited",
      email,
    })
  }

  const [participantCount, pendingCount] = await Promise.all([
    db.participant.count({ where: { pollId: poll.id } }),
    db.joinRequest.count({ where: { pollId: poll.id } }),
  ])
  if (participantCount + pendingCount >= MAX_PEOPLE_PER_POLL) {
    return NextResponse.json({ error: "This poll is full." }, { status: 400 })
  }

  const now = new Date()
  const pending = await db.joinRequest.findUnique({
    where: { pollId_email: { pollId: poll.id, email } },
  })

  // Refreshing the page should not send another message.
  if (pending && now.getTime() - pending.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json({ status: "sent", email })
  }

  const request = await db.joinRequest.upsert({
    where: { pollId_email: { pollId: poll.id, email } },
    create: { pollId: poll.id, name, email, expires: new Date(now.getTime() + EXPIRY_MS) },
    update: { name, expires: new Date(now.getTime() + EXPIRY_MS), lastSentAt: now },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const delivery = await sendJoinVerification({
    participantName: name,
    participantEmail: email,
    creatorName: creatorDisplayName(poll.creator),
    pollTitle: poll.title,
    verifyUrl: `${appUrl}/join/verify/${request.token}`,
  })

  if (delivery.failed.length > 0) {
    console.error(`[join] poll ${poll.id}: verification refused`, delivery.failed)
    return NextResponse.json(
      { error: "We couldn't send to that address. Check it and try again." },
      { status: 502 },
    )
  }

  return NextResponse.json({ status: "sent", email })
}
