import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { MAX_SUGGESTIONS_PER_POLL } from "@/lib/limits"
import { pollMutationLockKey } from "@/lib/poll-closing"

const schema = z.object({ label: z.string().trim().min(1).max(200) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const located = await db.participant.findUnique({
    where: { token },
    select: { id: true, pollId: true, optedOut: true },
  })
  if (!located) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  if (located.optedOut) return NextResponse.json({ error: "Opted out" }, { status: 400 })

  const result = await db.$transaction(async (tx) => {
    // Ballot writes use the same lock. If a first vote and a suggestion race,
    // exactly one wins: once a ballot lands, the option set is frozen.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(located.pollId)}))`

    const poll = await tx.poll.findUnique({
      where: { id: located.pollId },
      include: { options: { select: { id: true, order: true, suggestedByName: true } } },
    })
    if (!poll) return { error: "NOT_FOUND" as const }
    if (poll.status !== "OPEN") return { error: "CLOSED" as const }
    if (!poll.allowSuggestions || poll.type !== "SINGLE_CHOICE") return { error: "DISABLED" as const }

    const votedCount = await tx.participant.count({
      where: { pollId: poll.id, optedOut: false, votedAt: { not: null } },
    })
    if (votedCount > 0) return { error: "VOTING_STARTED" as const }

    const suggestionCount = poll.options.filter((option) => option.suggestedByName).length
    if (suggestionCount >= MAX_SUGGESTIONS_PER_POLL) return { error: "LIMIT" as const }

    const maxOrder = Math.max(...poll.options.map((option) => option.order), -1)
    const option = await tx.pollOption.create({
      data: {
        pollId: poll.id,
        label: parsed.data.label,
        suggestedByName: (await tx.participant.findUnique({ where: { id: located.id }, select: { name: true } }))?.name ?? "Participant",
        order: maxOrder + 1,
      },
      select: { id: true, label: true, suggestedByName: true },
    })
    return { option }
  })

  if ("error" in result) {
    if (result.error === "NOT_FOUND") return NextResponse.json({ error: "Invalid link" }, { status: 404 })
    if (result.error === "CLOSED") return NextResponse.json({ error: "Poll is closed" }, { status: 400 })
    if (result.error === "DISABLED") return NextResponse.json({ error: "Suggestions are not available on this poll." }, { status: 403 })
    if (result.error === "VOTING_STARTED") {
      return NextResponse.json(
        { error: "Suggestions close once voting starts so earlier ballots never become stale." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "This poll has reached its suggestion limit" }, { status: 400 })
  }

  return NextResponse.json(result.option)
}
