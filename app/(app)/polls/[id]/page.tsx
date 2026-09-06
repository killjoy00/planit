import { randomUUID } from "node:crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { PollResults } from "@/components/poll/PollResults"
import { PollSettings } from "@/components/poll/PollSettings"
import { RecurringSeries } from "@/components/poll/RecurringSeries"
import { PlanCompletion } from "@/components/poll/PlanCompletion"
import { appUrl } from "@/lib/site"
import { describeSchedule } from "@/lib/reminder-schedule"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session!.user!.id!

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      participants: { include: { votes: true }, orderBy: { createdAt: "asc" } },
      winner: true,
      group: { select: { name: true } },
      series: { select: { cadence: true, interval: true, active: true } },
    },
  })

  if (!poll || poll.creatorId !== userId) notFound()

  const nextOccurrence = poll.seriesId && poll.seriesSequence
    ? await db.poll.findFirst({
        where: { seriesId: poll.seriesId, seriesSequence: poll.seriesSequence + 1 },
        select: { id: true },
      })
    : null

  // Polls that predate share links have none; mint one the first time their
  // creator looks, so every poll has a link to hand out.
  let shareToken = poll.shareToken
  if (!shareToken) {
    shareToken = randomUUID()
    await db.poll.update({ where: { id: poll.id }, data: { shareToken } })
  }

  const winnerWhen = poll.winner?.dateValue
    ? poll.type === "TIME_POLL" && poll.timeZone
      ? formatTimeSlot(poll.winner.dateValue, poll.winner.endDate, poll.timeZone)
      : formatDateRange(poll.winner.dateValue, poll.winner.endDate)
    : null

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <div>
        <div className="flex items-center gap-2">
          {poll.group && <span className="text-sm text-gray-500">{poll.group.name} ·</span>}
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
            poll.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>{poll.status}</span>
          {poll.series && poll.series.active && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Recurring</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{poll.title}</h1>
        {poll.description && <p className="mt-1 text-gray-600">{poll.description}</p>}
        {poll.status === "OPEN" && poll.reminderLevel < 3 && (
          <p className="mt-2 text-xs text-gray-400">
            Reminding people who haven&apos;t voted: {describeSchedule(poll)}
          </p>
        )}
      </div>

      <PollSettings
        pollId={poll.id}
        status={poll.status}
        title={poll.title}
        description={poll.description}
        deadline={poll.deadline?.toISOString() ?? null}
        threshold={poll.threshold}
        reminderSchedule={poll.reminderSchedule}
        replyToCreator={poll.replyToCreator}
        finalLocation={poll.finalLocation}
        finalNotes={poll.finalNotes}
      />

      <RecurringSeries
        pollId={poll.id}
        status={poll.status}
        series={poll.series}
        nextPollId={nextOccurrence?.id ?? null}
        canConfigure={!nextOccurrence}
      />

      {poll.status === "CLOSED" && poll.winner && (
        <PlanCompletion
          title={poll.title}
          winnerLabel={poll.winner.label}
          when={winnerWhen}
          location={poll.finalLocation}
          notes={poll.finalNotes}
          calendarUrl={poll.winner.dateValue ? `/api/polls/ics/${poll.id}` : null}
        />
      )}

      <PollResults
        pollId={id}
        initialData={{
          status: poll.status,
          winnerId: poll.winnerId,
          winner: poll.winner ? { id: poll.winner.id, label: poll.winner.label, dateValue: poll.winner.dateValue?.toISOString() ?? null, endDate: poll.winner.endDate?.toISOString() ?? null } : null,
          options: poll.options.map((o) => ({
            id: o.id, label: o.label,
            dateValue: o.dateValue?.toISOString() ?? null,
            endDate: o.endDate?.toISOString() ?? null,
            suggestedByName: o.suggestedByName,
            voteCount: 0,
            idealCount: 0,
          })),
          participants: poll.participants.map((p) => ({
            id: p.id, name: p.name, email: p.email,
            voteUrl: `${appUrl()}/vote/${p.token}`,
            voted: !!p.votedAt, optedOut: p.optedOut,
            inviteDelivered: !!p.inviteSentAt,
            resultDelivered: !!p.resultSentAt,
            optionIds: p.votes.map((v) => v.optionId).filter((optionId): optionId is string => !!optionId),
            choice: p.votes.find((v) => v.choice)?.choice ?? null,
            preferences: p.votes
              .filter((v) => v.optionId && v.preference)
              .map((v) => ({ optionId: v.optionId!, preference: v.preference! })),
          })),
        }}
        pollType={poll.type}
        icsAvailable={!!poll.winner?.dateValue}
        pollIdForIcs={id}
        pollTitle={poll.title}
        shareUrl={`${appUrl()}/join/${shareToken}`}
        timeZone={poll.timeZone}
      />
    </div>
  )
}
