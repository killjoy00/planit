import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { deliverInvites } from "@/lib/invites"

/**
 * Re-send the invitation to everyone the mail provider never accepted.
 *
 * A refused invitation leaves the participant on the poll with nothing in
 * their inbox, and there is no other way for them to reach their vote link —
 * the token only ever travels by email. This is the creator's way out.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: true,
      creator: { select: { name: true, email: true } },
      participants: { where: { inviteSentAt: null, optedOut: false } },
    },
  })

  if (!poll || poll.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "Poll is closed" }, { status: 400 })
  }
  if (poll.participants.length === 0) {
    return NextResponse.json({ error: "Every invitation has already been delivered." }, { status: 400 })
  }

  const delivery = await deliverInvites(poll, poll.participants)

  return NextResponse.json({
    sent: delivery.sent.length,
    failed: delivery.failed.map((f) => ({ email: f.email, reason: f.reason })),
    unsubscribed: delivery.suppressed.length,
  })
}
