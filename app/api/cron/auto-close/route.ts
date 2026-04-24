import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { determineWinner } from "@/lib/poll-logic"
import { sendWinnerEmail } from "@/lib/email"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const expired = await db.poll.findMany({
    where: { status: "OPEN", deadline: { lte: now } },
    include: {
      options: true,
      participants: { include: { vote: true } },
      votes: true,
    },
  })

  let closed = 0
  for (const poll of expired) {
    const winner = determineWinner(poll)
    await db.poll.update({
      where: { id: poll.id },
      data: { status: "CLOSED", winnerId: winner?.id ?? null },
    })

    if (winner) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      await Promise.allSettled(
        poll.participants
          .filter((p) => !p.optedOut)
          .map((p) =>
            sendWinnerEmail({
              participantName: p.name,
              participantEmail: p.email,
              pollTitle: poll.title,
              winnerLabel: winner.label,
              resultsUrl: `${appUrl}/polls/${poll.id}`,
              icsUrl: winner.dateValue ? `${appUrl}/api/polls/ics/${poll.id}` : undefined,
            })
          )
      )
    }
    closed++
  }

  return NextResponse.json({ closed })
}
