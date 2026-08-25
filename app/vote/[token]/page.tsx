import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { VotingForm } from "@/components/vote/VotingForm"
import { isMultiSelect } from "@/lib/poll-logic"
import { creatorDisplayName } from "@/lib/display-name"

export default async function VotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: {
      votes: { select: { optionId: true, choice: true } },
      poll: {
        include: {
          options: { orderBy: { order: "asc" } },
          creator: { select: { name: true, email: true } },
          participants: { select: { id: true, votedAt: true, optedOut: true } },
        },
      },
    },
  })

  if (!participant) notFound()
  if (participant.optedOut) redirect(`/vote/${token}/opted-out`)
  if (participant.poll.status !== "OPEN") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-2">
          <p className="text-2xl">🔒</p>
          <h1 className="text-xl font-bold text-gray-900">This poll is closed</h1>
          <p className="text-gray-500">Voting has ended.</p>
          <a href={`/vote/${token}/results`} className="inline-block text-sm text-indigo-600 hover:underline">
            See the result
          </a>
        </div>
      </main>
    )
  }

  const voted = participant.poll.participants.filter((p) => p.votedAt && !p.optedOut).length
  const total = participant.poll.participants.filter((p) => !p.optedOut).length

  // Someone who has already answered gets their ballot back, filled in, rather
  // than a dead end — the poll is still open, so their answer can still change.
  const hasVoted = participant.votedAt !== null
  const selectedIds = participant.votes
    .map((v) => v.optionId)
    .filter((id): id is string => !!id)
  const choice = participant.votes.find((v) => v.choice)?.choice ?? null

  return (
    <main className="flex-1 bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            {hasVoted
              ? `You've voted — ${creatorDisplayName(participant.poll.creator)}'s plan`
              : `${creatorDisplayName(participant.poll.creator)} wants your vote`}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{participant.poll.title}</h1>
          {participant.poll.description && (
            <p className="mt-2 text-gray-600">{participant.poll.description}</p>
          )}
          <p className="mt-3 text-sm text-gray-400">{voted} of {total} have voted</p>
        </div>

        <VotingForm
          token={token}
          pollType={participant.poll.type}
          options={participant.poll.options.map((o) => ({
            id: o.id,
            label: o.label,
            dateValue: o.dateValue ? o.dateValue.toISOString() : null,
            endDate: o.endDate ? o.endDate.toISOString() : null,
          }))}
          participantName={participant.name}
          optOutUrl={`/vote/${token}/opted-out`}
          allowSuggestions={participant.poll.allowSuggestions}
          multiSelect={isMultiSelect(participant.poll.type)}
          hasVoted={hasVoted}
          initialSelectedIds={selectedIds}
          initialChoice={choice}
        />
      </div>
    </main>
  )
}
