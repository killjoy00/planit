import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { VotingForm } from "@/components/vote/VotingForm"

export default async function VotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: {
      poll: {
        include: {
          options: { orderBy: { order: "asc" } },
          creator: { select: { name: true } },
          participants: { select: { id: true, votedAt: true, optedOut: true } },
        },
      },
    },
  })

  if (!participant) notFound()
  if (participant.optedOut) redirect(`/vote/${token}/opted-out`)
  if (participant.votedAt) redirect(`/vote/${token}/done`)
  if (participant.poll.status !== "OPEN") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-2">
          <p className="text-2xl">🔒</p>
          <h1 className="text-xl font-bold text-gray-900">This poll is closed</h1>
          <p className="text-gray-500">Voting has ended. Check your email for the result.</p>
        </div>
      </main>
    )
  }

  const voted = participant.poll.participants.filter((p) => p.votedAt && !p.optedOut).length
  const total = participant.poll.participants.filter((p) => !p.optedOut).length

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            {participant.poll.creator.name ?? "Someone"} wants your vote
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
        />
      </div>
    </main>
  )
}
