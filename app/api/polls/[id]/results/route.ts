import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: { include: { votes: true }, orderBy: { order: "asc" } },
      participants: { include: { votes: true }, orderBy: { createdAt: "asc" } },
      winner: true,
    },
  })

  if (!poll || poll.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    status: poll.status,
    winnerId: poll.winnerId,
    winner: poll.winner,
    options: poll.options.map((o) => ({ id: o.id, label: o.label, dateValue: o.dateValue, endDate: o.endDate, suggestedByName: o.suggestedByName, voteCount: o.votes.length })),
    participants: poll.participants.map((p) => ({
      id: p.id, name: p.name, email: p.email,
      voted: !!p.votedAt, optedOut: p.optedOut,
      inviteDelivered: !!p.inviteSentAt,
      optionIds: p.votes.map((v) => v.optionId).filter((id): id is string => !!id),
      choice: p.votes.find((v) => v.choice)?.choice ?? null,
    })),
  })
}
