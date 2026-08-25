import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { CLOSABLE_POLL_INCLUDE, closePollAndAnnounce } from "@/lib/close-poll"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({
    where: { id },
    include: CLOSABLE_POLL_INCLUDE,
  })

  if (!poll || poll.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "Poll already closed" }, { status: 400 })
  }

  const { closed, winner } = await closePollAndAnnounce(poll, "close")
  if (!closed) {
    return NextResponse.json({ error: "Poll already closed" }, { status: 400 })
  }

  return NextResponse.json({ ok: true, winnerId: winner?.id ?? null })
}
