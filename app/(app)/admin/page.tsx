import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isAdminEmail } from "@/lib/admin"

const DAY_MS = 24 * 60 * 60 * 1000
const SERIES_DAYS = 14

interface DailyRow {
  day: Date
  count: bigint
}

interface ActivationStatsRow {
  first_poll_with_vote: bigint
  matured_creators: bigint
  second_within_30d: bigint
  repeat_creators: bigint
  recurring_creators: bigint
}

function fillDays(rows: DailyRow[], days: number): { date: Date; count: number }[] {
  const byDay = new Map(rows.map((row) => [new Date(row.day).toDateString(), Number(row.count)]))
  const out: { date: Date; count: number }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS)
    out.push({ date, count: byDay.get(date.toDateString()) ?? 0 })
  }
  return out
}

function percent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null
}

export default async function AdminPage() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) notFound()

  const now = new Date()
  const since14d = new Date(now.getTime() - (SERIES_DAYS - 1) * DAY_MS)
  const since7d = new Date(now.getTime() - 7 * DAY_MS)
  const since30d = new Date(now.getTime() - 30 * DAY_MS)

  const [
    totalUsers,
    totalCreators,
    totalGroups,
    totalPolls,
    openPolls,
    pollsByType,
    totalParticipants,
    votedParticipants,
    optedOutParticipants,
    totalVotes,
    inviteFailedCount,
    inviteDeliveredCount,
    suppressionCount,
    usersLast7d,
    pollsLast7d,
    activeCreators30d,
    recentPolls,
    userSeriesRaw,
    pollSeriesRaw,
    newUsers30d,
    activatedNewUsers30d,
    successfulClosedPolls,
    activationStatsRaw,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { polls: { some: {} } } }),
    db.group.count(),
    db.poll.count(),
    db.poll.count({ where: { status: "OPEN" } }),
    db.poll.groupBy({ by: ["type"], _count: { _all: true } }),
    db.participant.count(),
    db.participant.count({ where: { votedAt: { not: null } } }),
    db.participant.count({ where: { optedOut: true } }),
    db.vote.count(),
    db.participant.count({ where: { inviteError: { not: null } } }),
    db.participant.count({ where: { inviteSentAt: { not: null } } }),
    db.emailSuppression.count(),
    db.user.count({ where: { createdAt: { gte: since7d } } }),
    db.poll.count({ where: { createdAt: { gte: since7d } } }),
    db.poll.findMany({
      where: { createdAt: { gte: since30d } },
      distinct: ["creatorId"],
      select: { creatorId: true },
    }),
    db.poll.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        creator: { select: { email: true } },
        _count: { select: { participants: true, votes: true } },
      },
    }),
    db.$queryRaw<DailyRow[]>`
      select date_trunc('day', "createdAt") as day, count(*) as count
      from "User" where "createdAt" >= ${since14d}
      group by 1 order by 1
    `,
    db.$queryRaw<DailyRow[]>`
      select date_trunc('day', "createdAt") as day, count(*) as count
      from "Poll" where "createdAt" >= ${since14d}
      group by 1 order by 1
    `,
    db.user.count({ where: { createdAt: { gte: since30d } } }),
    db.user.count({ where: { createdAt: { gte: since30d }, polls: { some: {} } } }),
    db.poll.count({ where: { status: "CLOSED", winnerId: { not: null } } }),
    db.$queryRaw<ActivationStatsRow[]>`
      with first_polls as (
        select distinct on ("creatorId") id, "creatorId", "createdAt"
        from "Poll"
        order by "creatorId", "createdAt", id
      )
      select
        count(*) filter (
          where exists (
            select 1 from "Participant" participant
            where participant."pollId" = first_polls.id
              and participant."votedAt" is not null
              and participant."optedOut" = false
          )
        ) as first_poll_with_vote,
        count(*) filter (where first_polls."createdAt" <= ${since30d}) as matured_creators,
        count(*) filter (
          where first_polls."createdAt" <= ${since30d}
            and exists (
              select 1 from "Poll" second_poll
              where second_poll."creatorId" = first_polls."creatorId"
                and second_poll."createdAt" > first_polls."createdAt"
                and second_poll."createdAt" <= first_polls."createdAt" + interval '30 days'
            )
        ) as second_within_30d,
        count(*) filter (
          where exists (
            select 1 from "Poll" later_poll
            where later_poll."creatorId" = first_polls."creatorId"
              and later_poll."createdAt" > first_polls."createdAt"
          )
        ) as repeat_creators,
        count(*) filter (
          where exists (
            select 1 from "RecurringSeries" series
            where series."creatorId" = first_polls."creatorId"
          )
        ) as recurring_creators
      from first_polls
    `,
  ])

  const activationStats = activationStatsRaw[0] ?? {
    first_poll_with_vote: BigInt(0),
    matured_creators: BigInt(0),
    second_within_30d: BigInt(0),
    repeat_creators: BigInt(0),
    recurring_creators: BigInt(0),
  }

  const votableParticipants = totalParticipants - optedOutParticipants
  const voteRate = percent(votedParticipants, votableParticipants) ?? 0
  const creatorRate = percent(totalCreators, totalUsers) ?? 0
  const firstPollWithVote = Number(activationStats.first_poll_with_vote)
  const maturedCreators = Number(activationStats.matured_creators)
  const secondWithin30d = Number(activationStats.second_within_30d)
  const repeatCreators = Number(activationStats.repeat_creators)
  const recurringCreators = Number(activationStats.recurring_creators)

  const userSeries = fillDays(userSeriesRaw, SERIES_DAYS)
  const pollSeries = fillDays(pollSeriesRaw, SERIES_DAYS)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Counts from planit&apos;s own database — not third-party analytics, and not shared.
        </p>
      </div>

      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatTile label="Users" value={totalUsers} sub={`+${usersLast7d} this week · signed in`} />
          <StatTile label="Creators" value={totalCreators} sub={`${creatorRate}% of users made a poll`} />
          <StatTile label="Polls" value={totalPolls} sub={`${openPolls} open · +${pollsLast7d} this week`} />
          <StatTile label="Vote-through rate" value={`${voteRate}%`} sub={`${votedParticipants} of ${votableParticipants}`} />
          <StatTile label="Groups" value={totalGroups} />
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Activation funnel</h2>
          <p className="mt-1 text-xs text-gray-400">Derived from account, poll, vote, close, and recurrence records already in the database.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ConversionTile
            label="Signup → first poll"
            rate={percent(totalCreators, totalUsers)}
            numerator={totalCreators}
            denominator={totalUsers}
            denominatorLabel="signed-in users"
          />
          <ConversionTile
            label="30-day signup cohort"
            rate={percent(activatedNewUsers30d, newUsers30d)}
            numerator={activatedNewUsers30d}
            denominator={newUsers30d}
            denominatorLabel="new users created a poll"
          />
          <ConversionTile
            label="First poll → first vote"
            rate={percent(firstPollWithVote, totalCreators)}
            numerator={firstPollWithVote}
            denominator={totalCreators}
            denominatorLabel="first polls got a participant vote"
          />
          <ConversionTile
            label="Poll → successful close"
            rate={percent(successfulClosedPolls, totalPolls)}
            numerator={successfulClosedPolls}
            denominator={totalPolls}
            denominatorLabel="polls closed with a winner"
          />
          <ConversionTile
            label="Second poll ≤ 30d"
            rate={percent(secondWithin30d, maturedCreators)}
            numerator={secondWithin30d}
            denominator={maturedCreators}
            denominatorLabel="matured first-poll creators repeated"
          />
          <ConversionTile
            label="Recurring adoption"
            rate={percent(recurringCreators, repeatCreators)}
            numerator={recurringCreators}
            denominator={repeatCreators}
            denominatorLabel="repeat creators started a series"
          />
        </div>
        <p className="mt-3 text-xs text-gray-400">“Second poll ≤ 30d” only includes creators whose first poll is at least 30 days old, so newer creators are not counted as failures before they have had the full window.</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-8">
        <DailyBars title="New users" series={userSeries} />
        <DailyBars title="New polls" series={pollSeries} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Poll types</h2>
        <div className="space-y-2">
          {pollsByType.map((row) => (
            <CountBar
              key={row.type}
              label={row.type.replace(/_/g, " ")}
              count={row._count._all}
              max={Math.max(...pollsByType.map((item) => item._count._all), 1)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Delivery health</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="Invites delivered" value={inviteDeliveredCount} />
          <StatTile label="Invites refused" value={inviteFailedCount} tone={inviteFailedCount > 0 ? "warn" : undefined} />
          <StatTile label="Unsubscribed" value={suppressionCount} />
          <StatTile label="Total votes cast" value={totalVotes} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active creators, last 30 days</h2>
        <p className="text-2xl font-bold text-gray-900">{activeCreators30d.length}</p>
        <p className="mt-0.5 text-xs text-gray-400">Distinct people who created a poll recently, not the all-time {totalCreators} above.</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent polls</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Creator</th>
                <th className="px-4 py-2 font-medium text-right">Invited</th>
                <th className="px-4 py-2 font-medium text-right">Votes</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentPolls.map((poll) => (
                <tr key={poll.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-900 max-w-[16rem] truncate">{poll.title}</td>
                  <td className="px-4 py-2 text-gray-500">{poll.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-gray-500">{poll.status}</td>
                  <td className="px-4 py-2 text-gray-500">{poll.creator.email}</td>
                  <td className="px-4 py-2 text-gray-500 text-right tabular-nums">{poll._count.participants}</td>
                  <td className="px-4 py-2 text-gray-500 text-right tabular-nums">{poll._count.votes}</td>
                  <td className="px-4 py-2 text-gray-400">{poll.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {recentPolls.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No polls yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatTile({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: "warn" }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "warn" && Number(value) > 0 ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function ConversionTile({
  label,
  rate,
  numerator,
  denominator,
  denominatorLabel,
}: {
  label: string
  rate: number | null
  numerator: number
  denominator: number
  denominatorLabel: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{rate === null ? "—" : `${rate}%`}</p>
      <p className="mt-0.5 text-xs text-gray-400">{numerator} of {denominator} {denominatorLabel}</p>
    </div>
  )
}

function CountBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = Math.round((count / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-gray-800 capitalize">{label.toLowerCase()}</span>
        <span className="text-sm text-gray-500 tabular-nums">{count}</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DailyBars({ title, series }: { title: string; series: { date: Date; count: number }[] }) {
  const max = Math.max(...series.map((day) => day.count), 1)
  const total = series.reduce((sum, day) => sum + day.count, 0)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-gray-400">{total} in {series.length} days</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {series.map((day, index) => (
          <div
            key={index}
            title={`${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${day.count}`}
            className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors"
            style={{ height: `${Math.max((day.count / max) * 100, day.count > 0 ? 6 : 2)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[11px] text-gray-400">
        <span>{series[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{series[series.length - 1].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  )
}
