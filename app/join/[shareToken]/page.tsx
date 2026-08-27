import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { JoinForm } from "@/components/join/JoinForm"
import { creatorDisplayName } from "@/lib/display-name"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

export default async function JoinPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params

  const poll = await db.poll.findUnique({
    where: { shareToken },
    include: {
      options: { orderBy: { order: "asc" } },
      creator: { select: { name: true, email: true } },
      participants: { select: { votedAt: true, optedOut: true } },
    },
  })
  if (!poll) notFound()

  const creatorName = creatorDisplayName(poll.creator)

  if (poll.status !== "OPEN") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-2">
          <p className="text-2xl">🔒</p>
          <h1 className="text-xl font-bold text-gray-900">This poll is closed</h1>
          <p className="text-gray-500">Voting has ended.</p>
        </div>
      </main>
    )
  }

  const voted = poll.participants.filter((p) => p.votedAt && !p.optedOut).length

  return (
    <main className="flex-1 bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-500">{creatorName} is planning</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{poll.title}</h1>
          {poll.description && <p className="mt-2 text-gray-600">{poll.description}</p>}
          {voted > 0 && (
            <p className="mt-3 text-sm text-gray-400">
              {voted} {voted === 1 ? "person has" : "people have"} voted so far
            </p>
          )}
        </div>

        {poll.options.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              What&apos;s on the table
            </p>
            {poll.options.slice(0, 5).map((o) => (
              <p key={o.id} className="text-sm text-gray-700">
                • {o.label}
                {o.dateValue && (
                  <span className="ml-1 text-gray-400">
                    ({poll.type === "TIME_POLL" && poll.timeZone
                      ? formatTimeSlot(o.dateValue, o.endDate, poll.timeZone)
                      : formatDateRange(o.dateValue, o.endDate)})
                  </span>
                )}
              </p>
            ))}
            {poll.options.length > 5 && (
              <p className="text-sm text-gray-400">+ {poll.options.length - 5} more</p>
            )}
          </div>
        )}

        <JoinForm shareToken={shareToken} pollTitle={poll.title} />
      </div>
    </main>
  )
}
