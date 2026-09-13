import type { Metadata } from "next"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { JoinForm } from "@/components/join/JoinForm"
import { FastJoinForm } from "@/components/join/FastJoinForm"
import { PlanCompletion } from "@/components/poll/PlanCompletion"
import { creatorDisplayName } from "@/lib/display-name"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareToken: string }>
}): Promise<Metadata> {
  const { shareToken } = await params
  const poll = await db.poll.findUnique({
    where: { shareToken },
    select: {
      title: true,
      description: true,
      status: true,
      creator: { select: { name: true, email: true } },
    },
  })
  if (!poll) return { title: "Join a planit poll" }

  const creatorName = creatorDisplayName(poll.creator)
  const description = poll.status === "OPEN"
    ? `${creatorName} wants your vote on ${poll.title}. Open the poll and answer without creating an account.`
    : `${creatorName}'s poll, ${poll.title}, has a final update.`

  return {
    title: poll.status === "OPEN" ? `Vote on ${poll.title}` : poll.title,
    description,
    openGraph: {
      title: poll.status === "OPEN" ? `${creatorName} wants your vote — ${poll.title}` : poll.title,
      description: poll.description?.trim() || description,
      url: `/join/${shareToken}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: poll.status === "OPEN" ? `${creatorName} wants your vote — ${poll.title}` : poll.title,
      description: poll.description?.trim() || description,
    },
  }
}

export default async function JoinPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params

  const poll = await db.poll.findUnique({
    where: { shareToken },
    include: {
      options: { orderBy: { order: "asc" } },
      winner: true,
      creator: { select: { name: true, email: true } },
      participants: { select: { votedAt: true, optedOut: true } },
    },
  })
  if (!poll) notFound()

  const creatorName = creatorDisplayName(poll.creator)
  const winnerWhen = poll.winner?.dateValue
    ? poll.type === "TIME_POLL" && poll.timeZone
      ? formatTimeSlot(poll.winner.dateValue, poll.winner.endDate, poll.timeZone)
      : formatDateRange(poll.winner.dateValue, poll.winner.endDate)
    : null

  if (poll.status === "CANCELLED") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-400">Plan update</p>
          <h1 className="text-xl font-bold text-gray-900">{poll.title}</h1>
          <p className="text-gray-500">This plan was cancelled by the organizer.</p>
        </div>
      </main>
    )
  }

  if (poll.status === "CLOSED") {
    return (
      <main className="flex-1 bg-gray-50 px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <p className="text-sm text-gray-500">{creatorName} planned</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{poll.title}</h1>
            {poll.description && <p className="mt-2 text-gray-600">{poll.description}</p>}
          </div>
          {poll.winner ? (
            <>
              <PlanCompletion
                title={poll.title}
                winnerLabel={poll.winner.label}
                when={winnerWhen}
                location={poll.finalLocation}
                notes={poll.finalNotes}
                calendarUrl={poll.winner.dateValue ? `/api/polls/ics/${poll.id}` : null}
              />
              <p className="text-center text-sm leading-6 text-gray-500">
                Voting is closed. This shared link stays here as the final plan.
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">The voting is finished.</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                The organizer still needs to choose the final result. Check this same link again for the finished plan.
              </p>
            </div>
          )}
        </div>
      </main>
    )
  }

  const voted = poll.participants.filter((participant) => participant.votedAt && !participant.optedOut).length

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
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">What&apos;s on the table</p>
            {poll.options.slice(0, 5).map((option) => (
              <p key={option.id} className="text-sm text-gray-700">
                • {option.label}
                {option.dateValue && (
                  <span className="ml-1 text-gray-400">
                    ({poll.type === "TIME_POLL" && poll.timeZone
                      ? formatTimeSlot(option.dateValue, option.endDate, poll.timeZone)
                      : formatDateRange(option.dateValue, option.endDate)})
                  </span>
                )}
              </p>
            ))}
            {poll.options.length > 5 && <p className="text-sm text-gray-400">+ {poll.options.length - 5} more</p>}
          </div>
        )}

        <FastJoinForm shareToken={shareToken} />

        <details className="rounded-xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">Use verified email instead</summary>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Email verification is useful when you want a personal link, reminders, and the result delivered to your inbox.
          </p>
          <div className="mt-4">
            <JoinForm shareToken={shareToken} />
          </div>
        </details>
      </div>
    </main>
  )
}
