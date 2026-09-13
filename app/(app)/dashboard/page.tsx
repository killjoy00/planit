import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { formatDistanceToNow } from "@/lib/date-utils"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const now = new Date()

  const [openPolls, pastPolls, groups] = await Promise.all([
    db.poll.findMany({
      where: { creatorId: userId, status: "OPEN" },
      include: {
        participants: { select: { id: true, votedAt: true, optedOut: true, inviteSentAt: true, inviteError: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.poll.findMany({
      where: { creatorId: userId, status: { not: "OPEN" } },
      include: {
        participants: { select: { id: true, votedAt: true, optedOut: true } },
        group: { select: { name: true } },
        winner: { select: { label: true, dateValue: true, endDate: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.group.findMany({
      where: { creatorId: userId },
      include: { members: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ])

  function formatWinnerDate(start: Date | null, end: Date | null, type: string, timeZone: string | null): string | null {
    if (!start) return null
    return type === "TIME_POLL" && timeZone
      ? formatTimeSlot(start, end, timeZone)
      : formatDateRange(start, end, true)
  }

  function openPollAction(poll: (typeof openPolls)[number]) {
    const active = poll.participants.filter((participant) => !participant.optedOut)
    const voted = active.filter((participant) => participant.votedAt).length
    const total = active.length
    const failed = active.filter((participant) => participant.inviteError || !participant.inviteSentAt).length
    const outstanding = Math.max(total - voted, 0)

    if (failed > 0) {
      return { text: `${failed} invite${failed === 1 ? "" : "s"} need attention`, urgent: true }
    }
    if (total === 0) return { text: "Share this poll to get the first vote", urgent: true }
    if (voted === total) return { text: "Everyone voted — ready to close", urgent: true }
    if (poll.threshold && voted >= poll.threshold) return { text: "Vote threshold reached — ready to close", urgent: true }
    if (poll.deadline && poll.deadline <= now) return { text: "Deadline passed — close the poll", urgent: true }
    if (poll.deadline && poll.deadline.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
      return {
        text: `${outstanding} still ${outstanding === 1 ? "needs" : "need"} to vote · deadline ${formatDistanceToNow(poll.deadline)}`,
        urgent: true,
      }
    }
    return {
      text: `${outstanding} still ${outstanding === 1 ? "needs" : "need"} to vote`,
      urgent: false,
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Each open poll shows the next thing that needs your attention.</p>
        </div>
        <Link
          href="/polls/new"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          + New poll
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Open polls</h2>
        {openPolls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            No open polls. <Link href="/polls/new" className="text-indigo-600 underline">Create one →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {openPolls.map((poll) => {
              const active = poll.participants.filter((participant) => !participant.optedOut)
              const voted = active.filter((participant) => participant.votedAt).length
              const action = openPollAction(poll)
              return (
                <Link
                  key={poll.id}
                  href={`/polls/${poll.id}`}
                  className={`block rounded-xl border bg-white px-5 py-4 transition-colors ${
                    action.urgent ? "border-amber-200 hover:border-amber-300" : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{poll.title}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {poll.group ? `${poll.group.name} · ` : ""}{voted}/{active.length} voted · {formatDistanceToNow(poll.createdAt)}
                      </p>
                      <p className={`mt-2 text-sm font-medium ${action.urgent ? "text-amber-700" : "text-indigo-600"}`}>
                        {action.text} →
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">Open</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Past polls</h2>
        {pastPolls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">No past polls yet.</div>
        ) : (
          <div className="space-y-2">
            {pastPolls.map((poll) => {
              const winnerDate = poll.winner
                ? formatWinnerDate(poll.winner.dateValue, poll.winner.endDate, poll.type, poll.timeZone)
                : null
              const needsDecision = poll.status === "CLOSED" && !poll.winner
              return (
                <Link
                  key={poll.id}
                  href={`/polls/${poll.id}`}
                  className={`flex items-center justify-between rounded-xl border bg-white px-5 py-3 transition-colors ${
                    needsDecision ? "border-amber-200 hover:border-amber-300" : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{poll.title}</p>
                    <p className={`mt-0.5 truncate text-sm ${needsDecision ? "font-medium text-amber-700" : "text-gray-500"}`}>
                      {needsDecision
                        ? "Tie or unfinished result — choose the final outcome"
                        : <>{poll.group ? `${poll.group.name} · ` : ""}{poll.winner ? `Winner: ${poll.winner.label}${winnerDate ? ` (${winnerDate})` : ""}` : "No winner"} · {formatDistanceToNow(poll.updatedAt)}</>}
                    </p>
                  </div>
                  <span className={`ml-3 rounded-full px-2.5 py-1 text-xs font-medium ${
                    needsDecision
                      ? "bg-amber-100 text-amber-800"
                      : poll.status === "CLOSED"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-50 text-red-600"
                  }`}>
                    {needsDecision ? "Needs decision" : poll.status === "CLOSED" ? "Closed" : "Cancelled"}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Recent groups</h2>
          <Link href="/groups" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-400">
            No groups yet. <Link href="/groups/new" className="text-indigo-600 underline">Create a group →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-indigo-300"
              >
                <p className="truncate font-medium text-gray-900">{group.name}</p>
                <p className="mt-0.5 text-sm text-gray-500">{group.members.length} members</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
