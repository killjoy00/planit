import { auth } from "@/lib/auth"
import { CLOSABLE_POLL_INCLUDE, deliverPollResults } from "@/lib/close-poll"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({ where: { id }, include: CLOSABLE_POLL_INCLUDE })
  if (!poll || poll.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (poll.status !== "CLOSED" || !poll.winnerId) {
    return NextResponse.json({ error: "This poll has no result to resend." }, { status: 400 })
  }

  const pending = poll.participants.filter((participant) => !participant.optedOut && !participant.resultSentAt)
  if (pending.length === 0) {
    return NextResponse.json({ error: "Every result has already been delivered." }, { status: 400 })
  }

  const delivery = await deliverPollResults(poll, pending, "resend-results")
  return NextResponse.json({
    sent: delivery.sent.length,
    failed: delivery.failed.map((failure) => ({ email: failure.email, reason: failure.reason })),
    unsubscribed: delivery.suppressed.length,
  })
}
