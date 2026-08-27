import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).nullable(),
  deadline: z.string().datetime().nullable(),
  threshold: z.number().int().positive().nullable(),
  reminderSchedule: z.enum(["AFTER_SEND", "BEFORE_DEADLINE"]),
  replyToCreator: z.boolean(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 })

  const poll = await db.poll.findFirst({
    where: { id, creatorId: session.user.id },
    select: { status: true, participants: { where: { optedOut: false }, select: { id: true } } },
  })
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (poll.status !== "OPEN") return NextResponse.json({ error: "Only open polls can be edited." }, { status: 400 })

  const { deadline, threshold, reminderSchedule } = parsed.data
  if (deadline && new Date(deadline) <= new Date()) {
    return NextResponse.json({ error: "The deadline must be in the future." }, { status: 400 })
  }
  if (reminderSchedule === "BEFORE_DEADLINE" && !deadline) {
    return NextResponse.json({ error: "Deadline-based reminders need a deadline." }, { status: 400 })
  }
  if (threshold && threshold > poll.participants.length) {
    return NextResponse.json({ error: "Auto-close cannot exceed the active participant count." }, { status: 400 })
  }

  await db.poll.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      deadline: deadline ? new Date(deadline) : null,
      threshold,
      reminderSchedule,
      replyToCreator: parsed.data.replyToCreator,
      // A changed schedule should get its own full ladder from this point.
      reminderLevel: 0,
      lastReminderAt: null,
    },
  })
  return NextResponse.json({ ok: true })
}
