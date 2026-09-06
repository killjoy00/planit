import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pollMutationLockKey } from "@/lib/poll-closing"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  cadence: z.enum(["WEEKLY", "MONTHLY"]),
  interval: z.number().int().min(1).max(12).default(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid recurrence." }, { status: 400 })

  const result = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(id)}))`
    const poll = await tx.poll.findFirst({
      where: { id, creatorId: session.user.id },
      select: { id: true, status: true, seriesId: true, seriesSequence: true },
    })
    if (!poll) return { error: "NOT_FOUND" as const }
    if (poll.status !== "OPEN") return { error: "NOT_OPEN" as const }

    if (poll.seriesId) {
      const laterOccurrence = await tx.poll.findFirst({
        where: {
          seriesId: poll.seriesId,
          seriesSequence: { gt: poll.seriesSequence ?? 0 },
        },
        select: { id: true },
      })
      if (laterOccurrence) return { error: "NOT_LATEST" as const }

      const series = await tx.recurringSeries.update({
        where: { id: poll.seriesId },
        data: { cadence: parsed.data.cadence, interval: parsed.data.interval, active: true },
      })
      return { series }
    }

    const series = await tx.recurringSeries.create({
      data: {
        creatorId: session.user.id,
        cadence: parsed.data.cadence,
        interval: parsed.data.interval,
      },
    })
    await tx.poll.update({
      where: { id },
      data: { seriesId: series.id, seriesSequence: 1 },
    })
    return { series }
  })

  if ("error" in result) {
    if (result.error === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (result.error === "NOT_OPEN") return NextResponse.json({ error: "Only an open poll can start or change a series." }, { status: 400 })
    return NextResponse.json({ error: "Change recurrence from the latest occurrence." }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    cadence: result.series.cadence,
    interval: result.series.interval,
    active: result.series.active,
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findFirst({
    where: { id, creatorId: session.user.id },
    select: { seriesId: true },
  })
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!poll.seriesId) return NextResponse.json({ error: "This poll is not recurring." }, { status: 400 })

  await db.recurringSeries.updateMany({
    where: { id: poll.seriesId, creatorId: session.user.id },
    data: { active: false },
  })
  return NextResponse.json({ ok: true, active: false })
}
