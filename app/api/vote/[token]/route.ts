import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkThreshold, determineWinner } from "@/lib/poll-logic"
import { sendWinnerEmail } from "@/lib/email"

const schema = z.object({
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

  const { optionId, choice } = parsed.data

  if (participant.poll.type === "YES_NO_VETO" && !choice) {
    return NextResponse.json({ error: "Choice required" }, { status: 400 })
  }
  if (participant.poll.type !== "YES_NO_VETO" && !optionId) {
    return NextResponse.json({ error: "Option required" }, { status: 400 })
  }

  await db.$transaction([
    db.vote.create({
      data: {
        participantId: participant.id,
        pollId: participant.pollId,
        optionId: optionId ?? null,
        choice: choice ?? null,
      },
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
      include: { options: true, participants: { include: { vote: true } }, votes: true },
    })
    if (fullPoll && fullPoll.status === "OPEN") {
      const winner = determineWinner(fullPoll)
      await db.poll.update({
        where: { id: participant.pollId },
        data: { status: "CLOSED", winnerId: winner?.id ?? null },
      })

      if (winner) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        await Promise.allSettled(
          fullPoll.participants
            .filter((p) => !p.optedOut)
            .map((p) =>
              sendWinnerEmail({
                participantName: p.name,
                participantEmail: p.email,
                pollTitle: fullPoll.title,
                winnerLabel: winner.label,
                resultsUrl: `${appUrl}/polls/${fullPoll.id}`,
                icsUrl: winner.dateValue ? `${appUrl}/api/polls/ics/${fullPoll.id}` : undefined,
              })
            )
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}
