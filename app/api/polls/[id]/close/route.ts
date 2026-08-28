import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  CLOSABLE_POLL_INCLUDE,
  closePollAndAnnounce,
  resolvePollTieAndAnnounce,
} from "@/lib/close-poll"

const schema = z.object({ winnerId: z.string().optional() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid winner" }, { status: 400 })

  if (poll.status !== "OPEN" && !(poll.status === "CLOSED" && !poll.winnerId && parsed.data.winnerId)) {
    return NextResponse.json({ error: "Poll already closed" }, { status: 400 })
  }

  const outcome = await (poll.status === "OPEN"
    ? closePollAndAnnounce(poll, "close", parsed.data.winnerId)
    : resolvePollTieAndAnnounce(poll, parsed.data.winnerId!, "tie-resolution")
  ).catch((error: unknown) => {
    if (error instanceof Error && error.message === "INVALID_WINNER") return null
    throw error
  })
  if (!outcome) return NextResponse.json({ error: "Choose one of the tied options." }, { status: 400 })

  const { closed, winner, needsDecision, winnerCandidates } = outcome
  if (!closed) {
    return NextResponse.json({ error: "Poll already closed" }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    winnerId: winner?.id ?? null,
    needsDecision,
    winnerCandidateIds: winnerCandidates.map((option) => option.id),
  })
}
