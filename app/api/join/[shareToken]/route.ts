import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendJoinVerification } from "@/lib/email"
import { creatorDisplayName } from "@/lib/display-name"
import { appUrl } from "@/lib/site"
import { MAX_INVITEES_PER_POLL } from "@/lib/limits"
import { clientIp, reserveEmailSend } from "@/lib/signin-rate-limit"
import { deliverInvites } from "@/lib/invites"

const schema = z.object({
  // Trimmed before validating, not after: a pasted address routinely carries
  // trailing whitespace, and rejecting it here reads to the sender as "this
  // site says my email is invalid".
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
})

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
    include: {
      creator: { select: { name: true, email: true } },
      options: true,
    },
  })
  if (!poll) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 })
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "This poll is closed." }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter your name and a valid email." }, { status: 400 })
  }

  const { name, email } = parsed.data

  // Already on the poll: never make a second participant with a second ballot.
  // A public join link cannot reveal the existing bearer token to someone who
  // merely knows an email address, but it can safely send that token back to
  // the address that originally received it.
  const existing = await db.participant.findUnique({
    where: { pollId_email: { pollId: poll.id, email } },
    select: { name: true, email: true, token: true, votedAt: true, optedOut: true },
  })
  if (existing) {
    if (existing.optedOut) {
      return NextResponse.json({ error: "You opted out of this poll." }, { status: 400 })
    }
  }

  const now = new Date()
  const pending = await db.joinRequest.findUnique({
    where: { pollId_email: { pollId: poll.id, email } },
  })

  // Refreshing the page should not send another message.
  if (pending && now.getTime() - pending.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json({ status: "sent", email })
  }

  const ip = await clientIp()
  const refusal = await reserveEmailSend({
    purpose: "JOIN",
    email,
    ip,
    scope: shareToken,
    now,
  })
  if (refusal) {
    return NextResponse.json(
      { error: "A confirmation was just sent, or this link has sent too many recently. Try again later." },
      { status: 429 },
    )
  }

  if (existing) {
    const delivery = await deliverInvites(poll, [existing])
    if (delivery.sent.length === 0) {
      return NextResponse.json(
        { error: "We couldn't resend your personal voting link. Ask the organizer to send it directly." },
        { status: 502 },
      )
    }
    return NextResponse.json({ status: "resent", email })
  }

  const request = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`poll-join:${poll.id}`}))`
    const [participantCount, otherPendingCount] = await Promise.all([
      tx.participant.count({ where: { pollId: poll.id } }),
      tx.joinRequest.count({ where: { pollId: poll.id, email: { not: email } } }),
    ])
    if (participantCount + otherPendingCount >= MAX_INVITEES_PER_POLL) return null
    return tx.joinRequest.upsert({
      where: { pollId_email: { pollId: poll.id, email } },
      create: { pollId: poll.id, name, email, expires: new Date(now.getTime() + EXPIRY_MS) },
      update: { name, expires: new Date(now.getTime() + EXPIRY_MS), lastSentAt: now },
    })
  })
  if (!request) return NextResponse.json({ error: "This poll is full." }, { status: 400 })

  const delivery = await sendJoinVerification({
    participantName: name,
    participantEmail: email,
    creatorName: creatorDisplayName(poll.creator),
    pollTitle: poll.title,
    verifyUrl: `${appUrl()}/join/verify/${request.token}`,
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
