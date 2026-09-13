import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { appUrl } from "@/lib/site"
import { isFastJoinEmail, participantContactLabel } from "@/lib/fast-join"

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
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      dateValue: option.dateValue,
      endDate: option.endDate,
      suggestedByName: option.suggestedByName,
      voteCount: option.votes.length,
      idealCount: option.votes.filter((vote) => vote.preference === "IDEAL").length,
    })),
    participants: poll.participants.map((participant) => {
      const fastJoin = isFastJoinEmail(participant.email)
      return {
        id: participant.id,
        name: participant.name,
        email: participantContactLabel(participant.email),
        voteUrl: `${appUrl()}/vote/${participant.token}`,
        voted: !!participant.votedAt,
        optedOut: participant.optedOut,
        inviteDelivered: fastJoin || !!participant.inviteSentAt,
        resultDelivered: fastJoin || !!participant.resultSentAt,
        optionIds: participant.votes.map((vote) => vote.optionId).filter((optionId): optionId is string => !!optionId),
        choice: participant.votes.find((vote) => vote.choice)?.choice ?? null,
        preferences: participant.votes
          .filter((vote) => vote.optionId && vote.preference)
          .map((vote) => ({ optionId: vote.optionId!, preference: vote.preference! })),
      }
    }),
  })
}
