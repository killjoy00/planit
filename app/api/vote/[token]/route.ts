import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkThreshold, determineWinner, isMultiSelect } from "@/lib/poll-logic"
import { sendWinnerEmails } from "@/lib/email"

const schema = z.object({
  /** Selections for a choice poll. A date poll may send several. */
  optionIds: z.array(z.string()).optional(),
  /** Single-selection form of `optionIds`, still sent by older open tabs. */
  optionId: z.string().optional(),
  choice: z.enum(["YES", "FINE", "NO"]).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: { poll: { include: { options: true, votes: true, participants: true } } },
  })

  if (!participant) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  if (participant.optedOut) return NextResponse.json({ error: "Opted out" }, { status: 400 })
  if (participant.votedAt) return NextResponse.json({ error: "Already voted" }, { status: 400 })
  if (participant.poll.status !== "OPEN") return NextResponse.json({ error: "Poll is closed" }, { status: 400 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { choice } = parsed.data
  const { poll } = participant

  // One row per selection. `optionId` and `optionIds` mean the same thing; a
  // vote page loaded before this deployed still sends the singular form.
  const selectedIds = [
    ...new Set(parsed.data.optionIds ?? (parsed.data.optionId ? [parsed.data.optionId] : [])),
  ]

  if (poll.type === "YES_NO_VETO") {
    if (!choice) return NextResponse.json({ error: "Choice required" }, { status: 400 })
  } else {
    if (selectedIds.length === 0) {
      return NextResponse.json(
        {
          error: isMultiSelect(poll.type)
            ? "Pick at least one option."
            : "Option required",
        },
        { status: 400 },
      )
    }
    if (!isMultiSelect(poll.type) && selectedIds.length > 1) {
      return NextResponse.json({ error: "Only one option can be selected." }, { status: 400 })
    }
    // Never record a vote against an option belonging to some other poll.
    const validIds = new Set(poll.options.map((o) => o.id))
    if (selectedIds.some((id) => !validIds.has(id))) {
      return NextResponse.json({ error: "Unknown option." }, { status: 400 })
    }
  }

  await db.$transaction([
    db.vote.createMany({
      data:
        poll.type === "YES_NO_VETO"
          ? [{
              participantId: participant.id,
              pollId: participant.pollId,
              optionId: null,
              choice: choice ?? null,
            }]
          : selectedIds.map((id) => ({
              participantId: participant.id,
              pollId: participant.pollId,
              optionId: id,
              choice: null,
            })),
    }),
    db.participant.update({
      where: { id: participant.id },
      data: { votedAt: new Date(), tokenUsed: true },
    }),
  ])

  // Re-fetch votes to check threshold
  const allVotes = await db.vote.findMany({ where: { pollId: participant.pollId } })
  const shouldAutoClose = checkThreshold(participant.poll, allVotes)

  if (shouldAutoClose) {
    const fullPoll = await db.poll.findUnique({
      where: { id: participant.pollId },
      include: { options: true, participants: true, votes: true },
    })
    if (fullPoll && fullPoll.status === "OPEN") {
      const winner = determineWinner(fullPoll)
      await db.poll.update({
        where: { id: participant.pollId },
        data: { status: "CLOSED", winnerId: winner?.id ?? null },
      })

      if (winner) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        const delivery = await sendWinnerEmails(
          fullPoll.participants
            .filter((p) => !p.optedOut)
            .map((p) => ({
              participantName: p.name,
              participantEmail: p.email,
              pollTitle: fullPoll.title,
              winnerLabel: winner.label,
              resultsUrl: `${appUrl}/polls/${fullPoll.id}`,
              icsUrl: winner.dateValue ? `${appUrl}/api/polls/ics/${fullPoll.id}` : undefined,
            }))
        )
        if (delivery.failed.length > 0) {
          console.error(
            `[winner] poll ${fullPoll.id}: result refused for ${delivery.failed.length} participants`,
            delivery.failed,
          )
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
