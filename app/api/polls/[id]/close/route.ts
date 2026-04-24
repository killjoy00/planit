import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { determineWinner } from "@/lib/poll-logic"
import { sendWinnerEmail } from "@/lib/email"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: true,
      participants: { include: { vote: true } },
      votes: true,
    },
  })

  if (!poll || poll.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "Poll already closed" }, { status: 400 })
  }

  const winner = determineWinner(poll)
  await db.poll.update({
    where: { id },
    data: { status: "CLOSED", winnerId: winner?.id ?? null },
  })

  if (winner) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const resultsUrl = `${appUrl}/polls/${id}`
    const icsUrl = winner.dateValue ? `${appUrl}/api/polls/ics/${id}` : undefined

    await Promise.allSettled(
      poll.participants
        .filter((p) => !p.optedOut)
        .map((p) =>
          sendWinnerEmail({
            participantName: p.name,
            participantEmail: p.email,
            pollTitle: poll.title,
            winnerLabel: winner.label,
            resultsUrl,
            icsUrl,
          })
        )
    )
  }

  return NextResponse.json({ ok: true, winnerId: winner?.id ?? null })
}
