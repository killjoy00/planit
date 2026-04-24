import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { formatDistanceToNow } from "@/lib/date-utils"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [openPolls, groups] = await Promise.all([
    db.poll.findMany({
      where: { creatorId: userId, status: "OPEN" },
      include: {
        participants: { select: { id: true, votedAt: true, optedOut: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.group.findMany({
      where: { creatorId: userId },
      include: { members: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/polls/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New poll
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Open polls</h2>
        {openPolls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            No open polls.{" "}
            <Link href="/polls/new" className="text-indigo-600 underline">Create one →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {openPolls.map((poll) => {
              const voted = poll.participants.filter((p) => p.votedAt && !p.optedOut).length
              const total = poll.participants.filter((p) => !p.optedOut).length
              return (
                <Link
                  key={poll.id}
                  href={`/polls/${poll.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-indigo-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{poll.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {poll.group ? poll.group.name + " · " : ""}
                      {voted}/{total} voted · {formatDistanceToNow(poll.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-green-100 text-green-700 rounded-full px-2.5 py-1">Open</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent groups</h2>
          <Link href="/groups" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-400">
            No groups yet.{" "}
            <Link href="/groups/new" className="text-indigo-600 underline">Create a group →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-indigo-300 transition-colors"
              >
                <p className="font-medium text-gray-900 truncate">{group.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{group.members.length} members</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
