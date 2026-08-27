import Link from "next/link"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

export default async function VoteDonePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: {
      poll: {
        include: {
          options: { include: { votes: true }, orderBy: { order: "asc" } },
          votes: { select: { choice: true } },
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
    <main className="flex-1 bg-gray-50 px-4 py-12">
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
            {poll.winner.dateValue && (
              <p className="mt-1 text-sm text-gray-500">
                {poll.type === "TIME_POLL" && poll.timeZone
                  ? formatTimeSlot(poll.winner.dateValue, poll.winner.endDate, poll.timeZone)
                  : formatDateRange(poll.winner.dateValue, poll.winner.endDate)}
              </p>
            )}
          </div>
        ) : poll.type === "YES_NO_VETO" ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "YES", label: "Yes", emoji: "✅" },
              { value: "FINE", label: "Fine", emoji: "🤷" },
              { value: "NO", label: "Hard no", emoji: "❌" },
            ].map((choice) => (
              <div key={choice.value} className="rounded-xl border border-gray-200 bg-white py-3">
                <p className="text-xl">{choice.emoji}</p>
                <p className="font-bold text-gray-900">
                  {poll.votes.filter((vote) => vote.choice === choice.value).length}
                </p>
                <p className="text-xs text-gray-500">{choice.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-medium">Current standings</p>
            {poll.options.map((opt) => {
              const count = opt.votes.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const ideal = opt.votes.filter((vote) => vote.preference === "IDEAL").length
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-40 text-left truncate">{opt.label}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 shrink-0 text-right">
                      {poll.type === "TIME_POLL" ? `${count} · ${ideal} ideal` : count}
                    </span>
                  </div>
                  {opt.dateValue && (
                    <p className="text-xs text-left text-gray-400">
                      {poll.type === "TIME_POLL" && poll.timeZone
                        ? formatTimeSlot(opt.dateValue, opt.endDate, poll.timeZone)
                        : formatDateRange(opt.dateValue, opt.endDate)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Link
            href={`/vote/${token}/results`}
            className="block text-sm text-indigo-600 hover:underline"
          >
            See full results
          </Link>
          {poll.status === "OPEN" && (
            <Link
              href={`/vote/${token}`}
              className="block text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Change your vote
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
