import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { advanceRecurringSeries } from "@/lib/recurring-series"
import { NextRequest, NextResponse } from "next/server"

/**
 * Retry creating a recurring series' next occurrence, without touching the
 * poll that already closed or cancelled.
 *
 * Reopening and re-closing the poll would also retry this, but it resets
 * every participant's `resultSentAt`, so the next close resends the winner
 * announcement to everyone who already got it. Calling `advanceRecurringSeries`
 * directly retries only the failed step; `materializeNextSeriesPoll`'s own
 * lock and unique-sequence check make it safe to call again even if the next
 * occurrence was in fact created.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findFirst({
    where: { id, creatorId: session.user.id },
    select: { status: true, seriesId: true },
  })
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (poll.status === "OPEN") {
    return NextResponse.json({ error: "This occurrence is still open." }, { status: 400 })
  }
  if (!poll.seriesId) {
    return NextResponse.json({ error: "This poll is not part of a recurring series." }, { status: 400 })
  }

  let nextPollId: string | null
  try {
    nextPollId = await advanceRecurringSeries(id)
  } catch (error) {
    console.error(`[series retry] poll ${id}: could not advance recurring series`, error)
    return NextResponse.json({ error: "Could not create the next occurrence. Try again in a moment." }, { status: 500 })
  }
  if (!nextPollId) {
    return NextResponse.json({ error: "Could not create the next occurrence. The series may no longer be active." }, { status: 400 })
  }

  return NextResponse.json({ ok: true, nextPollId })
}
