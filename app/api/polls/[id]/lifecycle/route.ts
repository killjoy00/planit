import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pollMutationLockKey } from "@/lib/poll-closing"
import { advanceRecurringSeries } from "@/lib/recurring-series"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["CANCEL", "REOPEN"]),
  deadline: z.string().datetime().nullable().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  if (parsed.data.action === "CANCEL") {
    const cancelled = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(id)}))`
      const poll = await tx.poll.findFirst({
        where: { id, creatorId: session.user.id },
        select: { status: true },
      })
      if (!poll) return "NOT_FOUND" as const
      if (poll.status !== "OPEN") return "NOT_OPEN" as const
      await tx.poll.update({ where: { id }, data: { status: "CANCELLED", winnerId: null } })
      return "CANCELLED" as const
    })

    if (cancelled === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (cancelled === "NOT_OPEN") return NextResponse.json({ error: "Only open polls can be cancelled." }, { status: 400 })

    const nextPollId = await advanceRecurringSeries(id).catch((error) => {
      console.error(`[cancel] poll ${id}: could not advance recurring series`, error)
      return null
    })
    return NextResponse.json({ ok: true, status: "CANCELLED", nextPollId })
  }

  const deadline = parsed.data.deadline
  if (deadline && new Date(deadline) <= new Date()) {
    return NextResponse.json({ error: "The new deadline must be in the future." }, { status: 400 })
  }

  const reopened = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(id)}))`
    const poll = await tx.poll.findFirst({
      where: { id, creatorId: session.user.id },
      select: { status: true, seriesId: true, seriesSequence: true },
    })
    if (!poll) return "NOT_FOUND" as const
    if (poll.status === "OPEN") return "ALREADY_OPEN" as const

    // A past recurring occurrence becomes immutable once its successor exists;
    // reopening it would create two live occurrences in one series.
    if (poll.seriesId) {
      const later = await tx.poll.findFirst({
        where: { seriesId: poll.seriesId, seriesSequence: { gt: poll.seriesSequence ?? 0 } },
        select: { id: true },
      })
      if (later) return "HAS_SUCCESSOR" as const
    }

    await tx.poll.update({
      where: { id },
      data: {
        status: "OPEN",
        winnerId: null,
        deadline: deadline ? new Date(deadline) : null,
        reminderLevel: 0,
        lastReminderAt: null,
      },
    })
    await tx.participant.updateMany({
      where: { pollId: id },
      data: { resultSentAt: null, resultError: null },
    })
    return "OPEN" as const
  })

  if (reopened === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (reopened === "ALREADY_OPEN") return NextResponse.json({ error: "This poll is already open." }, { status: 400 })
  if (reopened === "HAS_SUCCESSOR") {
    return NextResponse.json({ error: "This recurring occurrence already has a successor and cannot be reopened." }, { status: 400 })
  }
  return NextResponse.json({ ok: true, status: "OPEN" })
}
