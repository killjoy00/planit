import { db } from "@/lib/db"
import { FAST_JOIN_EMAIL_SUFFIX } from "@/lib/fast-join"

interface AcquisitionRow {
  source: string
  use_case: string | null
  signups: bigint
  first_polls: bigint
  first_vote: bigint
  successful_close: bigint
  second_poll_30d: bigint
}

function percent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null
}

export async function AcquisitionFunnel() {
  const [rows, fastJoinParticipants] = await Promise.all([
    db.$queryRaw<AcquisitionRow[]>`
      with first_polls as (
        select distinct on ("creatorId") id, "creatorId", status, "winnerId", "createdAt"
        from "Poll"
        order by "creatorId", "createdAt", id
      )
      select
        coalesce(u."acquisitionSource", 'legacy / unknown') as source,
        u."acquisitionUseCase" as use_case,
        count(*) as signups,
        count(fp.id) as first_polls,
        count(fp.id) filter (
          where exists (
            select 1 from "Participant" p
            where p."pollId" = fp.id and p."votedAt" is not null and p."optedOut" = false
          )
        ) as first_vote,
        count(fp.id) filter (where fp.status = 'CLOSED' and fp."winnerId" is not null) as successful_close,
        count(fp.id) filter (
          where exists (
            select 1 from "Poll" p2
            where p2."creatorId" = u.id
              and p2."createdAt" > fp."createdAt"
              and p2."createdAt" <= fp."createdAt" + interval '30 days'
          )
        ) as second_poll_30d
      from "User" u
      left join first_polls fp on fp."creatorId" = u.id
      group by 1, 2
      order by signups desc, source asc, use_case asc nulls last
    `,
    db.participant.count({ where: { email: { endsWith: FAST_JOIN_EMAIL_SUFFIX } } }),
  ])

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Acquisition by source</h2>
        <p className="mt-1 text-xs text-gray-400">
          First-party labels only: normalized source, campaign, and use case. No raw referrer, IP, or third-party analytics.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Use case</th>
              <th className="px-4 py-2 font-medium text-right">Signups</th>
              <th className="px-4 py-2 font-medium text-right">First poll</th>
              <th className="px-4 py-2 font-medium text-right">First vote</th>
              <th className="px-4 py-2 font-medium text-right">Closed</th>
              <th className="px-4 py-2 font-medium text-right">2nd ≤30d</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const signups = Number(row.signups)
              const firstPolls = Number(row.first_polls)
              const firstVote = Number(row.first_vote)
              const closed = Number(row.successful_close)
              const second = Number(row.second_poll_30d)
              return (
                <tr key={`${row.source}:${row.use_case ?? "none"}`} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{row.source}</td>
                  <td className="px-4 py-2 text-gray-500">{row.use_case ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">{signups}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">{firstPolls} {percent(firstPolls, signups) !== null ? `(${percent(firstPolls, signups)}%)` : ""}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">{firstVote} {percent(firstVote, firstPolls) !== null ? `(${percent(firstVote, firstPolls)}%)` : ""}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">{closed} {percent(closed, firstPolls) !== null ? `(${percent(closed, firstPolls)}%)` : ""}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">{second} {percent(second, firstPolls) !== null ? `(${percent(second, firstPolls)}%)` : ""}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">Fast Join participants so far: {fastJoinParticipants}. Legacy accounts remain grouped as “legacy / unknown” instead of being backfilled with guesses.</p>
    </section>
  )
}
