import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { creatorDisplayName } from "@/lib/display-name"
import { isMultiSelect } from "@/lib/poll-logic"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

/**
 * The results, for the people who voted.
 *
 * Every winner email has carried a "See full results" button since results
 * existed, and it pointed at `/polls/[id]` — the creator's dashboard, behind a
 * session and an ownership check. Participants never have accounts (that is
 * the whole premise: no signup to vote), so the button sent them to a sign-in
 * page, and signing in only got them a 404. This is the same information at an
 * address the audience of that email can actually open.
 *
 * Authorised by the participant's own vote token: already in their inbox,
 * already unguessable, already scoped to one person on one poll. No new secret
 * and no new sign-in surface.
 *
 * Deliberately shows counts and not names. Who voted for what is the creator's
 * view — it is what the privacy policy says the app does — and widening that
 * to the whole guest list is a product decision, not a side effect of fixing a
 * broken link.
 */
export default async function VoteResultsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: {
      votes: { select: { optionId: true, choice: true, preference: true } },
      poll: {
        include: {
          options: { include: { votes: true }, orderBy: { order: "asc" } },
          // Yes/no ballots carry a `choice` and no `optionId`, so they hang off
          // the poll rather than any option — they are not reachable through
          // `options.votes`.
          votes: { select: { choice: true } },
          participants: { select: { votedAt: true, optedOut: true } },
          creator: { select: { name: true, email: true } },
          winner: true,
        },
      },
    },
  })

  if (!participant) notFound()

  const { poll } = participant
  const creatorName = creatorDisplayName(poll.creator)
  const voted = poll.participants.filter((p) => p.votedAt && !p.optedOut).length
  const total = poll.participants.filter((p) => !p.optedOut).length
  const myOptionIds = new Set(
    participant.votes.map((v) => v.optionId).filter((id): id is string => !!id),
  )
  const myChoice = participant.votes.find((v) => v.choice)?.choice ?? null
  const myPreferences = new Map(
    participant.votes
      .filter((vote) => vote.optionId && vote.preference)
      .map((vote) => [vote.optionId!, vote.preference!]),
  )
  const isOpen = poll.status === "OPEN"

  // On a date poll a vote means "this works for me", so the denominator is
  // people, not votes cast — several options can each reach 100%.
  const topCount = Math.max(1, ...poll.options.map((o) => o.votes.length))
  const barBasis = isMultiSelect(poll.type) ? Math.max(total, 1) : topCount

  return (
    <main className="flex-1 bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-500">{creatorName}&apos;s plan</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{poll.title}</h1>
          <p className="mt-3 text-sm text-gray-400">
            {voted} of {total} {voted === 1 ? "person has" : "people have"} voted
            {isOpen ? " so far" : ""}
          </p>
        </div>

        {poll.winner && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-6 text-center">
            <p className="text-sm text-indigo-600 font-medium uppercase tracking-wide">
              {poll.type === "YES_NO_VETO" ? "The answer" : "Winner"}
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1">{poll.winner.label}</p>
            {poll.winner.dateValue && (
              <p className="mt-1 text-sm text-gray-500">
                {poll.type === "TIME_POLL" && poll.timeZone
                  ? formatTimeSlot(poll.winner.dateValue, poll.winner.endDate, poll.timeZone)
                  : formatDateRange(poll.winner.dateValue, poll.winner.endDate)}
              </p>
            )}
            {poll.winner.dateValue && (
              <a
                href={`/api/polls/ics/${poll.id}`}
                className="inline-block mt-3 text-sm text-indigo-600 hover:underline"
              >
                Add to calendar (.ics)
              </a>
            )}
          </div>
        )}

        {!isOpen && !poll.winner && (
          <div className="rounded-xl bg-gray-100 border border-gray-200 p-6 text-center">
            <p className="text-gray-700 font-medium">This poll closed without a decision.</p>
            <p className="text-sm text-gray-500 mt-1">
              {poll.type === "YES_NO_VETO"
                ? "Someone vetoed it."
                : "No option got a vote."}
            </p>
          </div>
        )}

        {poll.type === "YES_NO_VETO" ? (
          <YesNoTally votes={poll.votes} myChoice={myChoice} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">
              {isOpen ? "Where it stands" : "Final count"}
            </p>
            {poll.options.map((opt) => {
              const count = opt.votes.length
              const pct = Math.round((count / barBasis) * 100)
              const mine = myOptionIds.has(opt.id)
              const myPreference = myPreferences.get(opt.id)
              const ideal = opt.votes.filter((vote) => vote.preference === "IDEAL").length
              const won = poll.winnerId === opt.id
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-gray-800 min-w-0">
                      <span className="block truncate">
                        {opt.label}
                        {mine && (
                          <span className="ml-1.5 text-xs text-indigo-600">
                            · {poll.type === "TIME_POLL" ? myPreference?.toLowerCase() : "your pick"}
                          </span>
                        )}
                      </span>
                      {opt.dateValue && (
                        <span className="block text-xs text-gray-400">
                          {poll.type === "TIME_POLL" && poll.timeZone
                            ? formatTimeSlot(opt.dateValue, opt.endDate, poll.timeZone)
                            : formatDateRange(opt.dateValue, opt.endDate)}
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gray-500 shrink-0 tabular-nums">
                      {poll.type === "TIME_POLL" ? `${count} · ${ideal} ideal` : count}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${won ? "bg-indigo-600" : mine ? "bg-indigo-400" : "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isOpen && (
          <div className="text-center pt-2">
            <Link href={`/vote/${token}`} className="text-sm text-indigo-600 hover:underline">
              {participant.votedAt ? "Change your vote" : "Cast your vote"}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

function YesNoTally({
  votes,
  myChoice,
}: {
  votes: Array<{ choice: string | null }>
  myChoice: string | null
}) {
  const rows = [
    { key: "YES", label: "Yes!", emoji: "✅" },
    { key: "FINE", label: "Fine by me", emoji: "🤷" },
    { key: "NO", label: "Hard no", emoji: "❌" },
  ]
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-500">Where it stands</p>
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <span className="text-sm text-gray-800">
            {row.emoji} {row.label}
            {myChoice === row.key && <span className="ml-1.5 text-xs text-indigo-600">· yours</span>}
          </span>
          <span className="text-sm text-gray-500 tabular-nums">
            {votes.filter((v) => v.choice === row.key).length}
          </span>
        </div>
      ))}
    </div>
  )
}
