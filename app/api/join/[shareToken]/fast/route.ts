import { db } from "@/lib/db"
import { createFastJoinEmail, isFastJoinEmail } from "@/lib/fast-join"
import { MAX_INVITEES_PER_POLL } from "@/lib/limits"
import { pollMutationLockKey } from "@/lib/poll-closing"
import { clientIp, reserveEmailSend } from "@/lib/signin-rate-limit"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().trim().min(1).max(80),
})

function cookieName(pollId: string): string {
  return `planit_fast_${pollId}`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the name your group will recognize." }, { status: 400 })
  }

  const located = await db.poll.findUnique({
    where: { shareToken },
    select: { id: true, status: true },
  })
  if (!located) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 })
  if (located.status !== "OPEN") return NextResponse.json({ error: "This poll is closed." }, { status: 400 })

  const existingToken = req.cookies.get(cookieName(located.id))?.value
  if (existingToken) {
    const existing = await db.participant.findFirst({
      where: { token: existingToken, pollId: located.id },
      select: { token: true, email: true, optedOut: true },
    })
    if (existing && isFastJoinEmail(existing.email)) {
      if (existing.optedOut) {
        return NextResponse.json({ error: "You opted out of this poll." }, { status: 400 })
      }
      return NextResponse.json({ ok: true, voteUrl: `/vote/${existing.token}`, reused: true })
    }
  }

  const fastEmail = createFastJoinEmail()
  const refusal = await reserveEmailSend({
    purpose: "JOIN",
    email: fastEmail,
    ip: await clientIp(),
    scope: shareToken,
  })
  if (refusal) {
    return NextResponse.json(
      { error: "This link has had too many join attempts recently. Try again later." },
      { status: 429 },
    )
  }

  const result = await db.$transaction(async (tx) => {
    // The mutation lock serializes joining with a close. The join lock shares
    // capacity with the verified-email join path so the two cannot overfill a poll.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(located.id)}))`
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`poll-join:${located.id}`}))`

    const poll = await tx.poll.findUnique({ where: { id: located.id }, select: { status: true } })
    if (!poll || poll.status !== "OPEN") return { kind: "closed" as const }

    const [participantCount, pendingCount] = await Promise.all([
      tx.participant.count({ where: { pollId: located.id } }),
      tx.joinRequest.count({ where: { pollId: located.id } }),
    ])
    if (participantCount + pendingCount >= MAX_INVITEES_PER_POLL) return { kind: "full" as const }

    const participant = await tx.participant.create({
      data: {
        pollId: located.id,
        name: parsed.data.name,
        email: fastEmail,
        // Fast join has no invitation to deliver. Mark it complete so organizer
        // delivery diagnostics do not treat this person as a failed email.
        inviteSentAt: new Date(),
      },
      select: { token: true },
    })
    return { kind: "created" as const, token: participant.token }
  })

  if (result.kind === "closed") {
    return NextResponse.json({ error: "This poll is closed." }, { status: 400 })
  }
  if (result.kind === "full") {
    return NextResponse.json({ error: "This poll has reached its participant limit." }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true, voteUrl: `/vote/${result.token}` })
  response.cookies.set(cookieName(located.id), result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  })
  return response
}
