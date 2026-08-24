import { db } from "@/lib/db"
import { creatorDisplayName } from "@/lib/display-name"
import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { determineWinner } from "@/lib/poll-logic"
import { sendWinnerEmails } from "@/lib/email"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const expired = await db.poll.findMany({
    where: { status: "OPEN", deadline: { lte: now } },
    include: {
      options: true,
      participants: true,
      votes: true,
      creator: { select: { name: true, email: true } },
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
      const delivery = await sendWinnerEmails(
        poll.participants
          .filter((p) => !p.optedOut)
          .map((p) => ({
            participantName: p.name,
            participantEmail: p.email,
            creatorName: creatorDisplayName(poll.creator),
            pollTitle: poll.title,
            winnerLabel: winner.label,
            resultsUrl: `${appUrl}/polls/${poll.id}`,
            icsUrl: winner.dateValue ? `${appUrl}/api/polls/ics/${poll.id}` : undefined,
            unsubscribeUrl: `${appUrl}/api/unsubscribe/${p.token}`,
            replyTo: poll.replyToCreator ? poll.creator.email ?? undefined : undefined,
          }))
      )
      if (delivery.failed.length > 0) {
        console.error(
          `[auto-close] poll ${poll.id}: result refused for ${delivery.failed.length} participants`,
          delivery.failed,
        )
      }
    }
    closed++
  }

  return NextResponse.json({ closed })
}
