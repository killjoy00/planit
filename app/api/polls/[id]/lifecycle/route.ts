import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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

  const poll = await db.poll.findFirst({
    where: { id, creatorId: session.user.id },
    select: { status: true },
  })
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (parsed.data.action === "CANCEL") {
    if (poll.status !== "OPEN") return NextResponse.json({ error: "Only open polls can be cancelled." }, { status: 400 })
    await db.poll.update({ where: { id }, data: { status: "CANCELLED", winnerId: null } })
    return NextResponse.json({ ok: true, status: "CANCELLED" })
  }

  if (poll.status === "OPEN") return NextResponse.json({ error: "This poll is already open." }, { status: 400 })
  const deadline = parsed.data.deadline
  if (deadline && new Date(deadline) <= new Date()) {
    return NextResponse.json({ error: "The new deadline must be in the future." }, { status: 400 })
  }

  await db.$transaction([
    db.poll.update({
      where: { id },
      data: {
        status: "OPEN",
        winnerId: null,
        deadline: deadline ? new Date(deadline) : null,
        reminderLevel: 0,
        lastReminderAt: null,
      },
    }),
    db.participant.updateMany({
      where: { pollId: id },
      data: { resultSentAt: null, resultError: null },
    }),
  ])
  return NextResponse.json({ ok: true, status: "OPEN" })
}
