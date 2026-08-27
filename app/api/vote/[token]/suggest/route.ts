import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { MAX_SUGGESTIONS_PER_POLL } from "@/lib/limits"

const schema = z.object({ label: z.string().trim().min(1).max(200) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: { poll: { select: { id: true, type: true, status: true, allowSuggestions: true, options: { select: { order: true, suggestedByName: true } } } } },
  })

  if (!participant) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  if (participant.optedOut) return NextResponse.json({ error: "Opted out" }, { status: 400 })
  if (participant.poll.status !== "OPEN") return NextResponse.json({ error: "Poll is closed" }, { status: 400 })
  if (!participant.poll.allowSuggestions) return NextResponse.json({ error: "Suggestions not allowed" }, { status: 403 })
  if (participant.poll.type !== "SINGLE_CHOICE") {
    return NextResponse.json({ error: "Suggestions are only available on choice polls" }, { status: 400 })
  }
  const suggestionCount = participant.poll.options.filter((option) => option.suggestedByName).length
  if (suggestionCount >= MAX_SUGGESTIONS_PER_POLL) {
    return NextResponse.json({ error: "This poll has reached its suggestion limit" }, { status: 400 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const maxOrder = Math.max(...participant.poll.options.map((o) => o.order), -1)

  const option = await db.pollOption.create({
    data: {
      pollId: participant.poll.id,
      label: parsed.data.label,
      suggestedByName: participant.name,
      order: maxOrder + 1,
    },
  })

  return NextResponse.json({ id: option.id, label: option.label, suggestedByName: option.suggestedByName })
}
