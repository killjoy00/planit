import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { creatorDisplayName } from "@/lib/display-name"
import { NextRequest, NextResponse } from "next/server"
import { determineWinner } from "@/lib/poll-logic"
import { sendWinnerEmails } from "@/lib/email"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: true,
      participants: true,
      votes: true,
      creator: { select: { name: true, email: true } },
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

    const delivery = await sendWinnerEmails(
      poll.participants
        .filter((p) => !p.optedOut)
        .map((p) => ({
          participantName: p.name,
          participantEmail: p.email,
          creatorName: creatorDisplayName(poll.creator),
          pollTitle: poll.title,
          winnerLabel: winner.label,
          resultsUrl,
          icsUrl,
          unsubscribeUrl: `${appUrl}/api/unsubscribe/${p.token}`,
          replyTo: poll.replyToCreator ? poll.creator.email ?? undefined : undefined,
        }))
    )
    if (delivery.failed.length > 0) {
      console.error(
        `[winner] poll ${id}: result refused for ${delivery.failed.length} participants`,
        delivery.failed,
      )
    }
  }

  return NextResponse.json({ ok: true, winnerId: winner?.id ?? null })
}
