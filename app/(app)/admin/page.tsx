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

/** `count` rows for every day in the window, zero-filled where the query had nothing. */
function fillDays(rows: DailyRow[], days: number): { date: Date; count: number }[] {
  const byDay = new Map(rows.map((r) => [new Date(r.day).toDateString(), Number(r.count)]))
  const out: { date: Date; count: number }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS)
    out.push({ date, count: byDay.get(date.toDateString()) ?? 0 })
  }
  return out
}

export default async function AdminPage() {
  const session = await auth()
  // A 404, not a 403: same convention as /polls/[id] for a non-owner — it
  // doesn't confirm to a signed-in stranger that this route exists at all.
  if (!isAdminEmail(session?.user?.email)) notFound()

  // `new Date()`, not `Date.now()` — the lint config here treats the latter as
  // an impure call this Next.js version won't allow during render (Cache
  // Components' purity check), even though both read the same system clock.
  const now = new Date()
  const since14d = new Date(now.getTime() - (SERIES_DAYS - 1) * DAY_MS)
  const since7d = new Date(now.getTime() - 7 * DAY_MS)
  const since30d = new Date(now.getTime() - 30 * DAY_MS)

  const [
    totalUsers,
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
  ] = await Promise.all([
    db.user.count(),
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
  ])

  // Non-opted-out is the honest denominator: someone who opted out was never
  // going to vote, and counting them against the rate makes every poll with a
  // dropout look worse than the people still on it actually are.
  const votableParticipants = totalParticipants - optedOutParticipants
  const voteRate = votableParticipants > 0 ? Math.round((votedParticipants / votableParticipants) * 100) : 0

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="Creators" value={totalUsers} sub={`+${usersLast7d} this week`} />
          <StatTile label="Polls" value={totalPolls} sub={`${openPolls} open · +${pollsLast7d} this week`} />
          <StatTile label="Vote-through rate" value={`${voteRate}%`} sub={`${votedParticipants} of ${votableParticipants}`} />
          <StatTile label="Groups" value={totalGroups} />
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-8">
        <DailyBars title="New creators" series={userSeries} />
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
              max={Math.max(...pollsByType.map((r) => r._count._all), 1)}
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Active creators, last 30 days
        </h2>
        <p className="text-2xl font-bold text-gray-900">{activeCreators30d.length}</p>
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
              {recentPolls.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-900 max-w-[16rem] truncate">{p.title}</td>
                  <td className="px-4 py-2 text-gray-500">{p.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-gray-500">{p.status}</td>
                  <td className="px-4 py-2 text-gray-500">{p.creator.email}</td>
                  <td className="px-4 py-2 text-gray-500 text-right tabular-nums">{p._count.participants}</td>
                  <td className="px-4 py-2 text-gray-500 text-right tabular-nums">{p._count.votes}</td>
                  <td className="px-4 py-2 text-gray-400">{p.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {recentPolls.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No polls yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: number | string
  sub?: string
  tone?: "warn"
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "warn" && Number(value) > 0 ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
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

/**
 * Fourteen daily bars, single hue, magnitude by height. The exact count and
 * date are on `title` — a native browser tooltip — rather than a label on
 * every bar, which would collide at this width; only the endpoints of the
 * range are labelled.
 */
function DailyBars({ title, series }: { title: string; series: { date: Date; count: number }[] }) {
  const max = Math.max(...series.map((d) => d.count), 1)
  const total = series.reduce((sum, d) => sum + d.count, 0)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-gray-400">{total} in {series.length} days</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {series.map((d, i) => (
          <div
            key={i}
            title={`${d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d.count}`}
            className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors"
            style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%` }}
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
