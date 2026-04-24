import { db } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function VoteDonePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: {
      poll: {
        include: {
          options: { include: { votes: true }, orderBy: { order: "asc" } },
          participants: { select: { votedAt: true, optedOut: true } },
          winner: true,
        },
      },
    },
  })

  if (!participant || !participant.votedAt) notFound()

  const { poll } = participant
  const voted = poll.participants.filter((p) => p.votedAt && !p.optedOut).length
  const total = poll.participants.filter((p) => !p.optedOut).length

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Vote received!</h1>
        <p className="text-gray-600">
          {voted} of {total} {voted === 1 ? "person has" : "people have"} voted on <strong>{poll.title}</strong>.
        </p>

        {poll.status === "CLOSED" && poll.winner ? (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-6">
            <p className="text-sm text-indigo-600 font-medium uppercase tracking-wide">Winner</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{poll.winner.label}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Current standings</p>
            {poll.options.map((opt) => {
              const count = opt.votes.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={opt.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-40 text-left truncate">{opt.label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
