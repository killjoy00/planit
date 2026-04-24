import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

export default async function GroupsPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const groups = await db.group.findMany({
    where: { creatorId: userId },
    include: { members: true },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <Link
          href="/groups/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          <p className="text-lg">No groups yet.</p>
          <Link href="/groups/new" className="mt-2 inline-block text-indigo-600 underline">Create your first group →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-indigo-300 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{group.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {group.members.length} member{group.members.length !== 1 ? "s" : ""} ·{" "}
                  {group.members.slice(0, 3).map((m) => m.name.split(" ")[0]).join(", ")}
                  {group.members.length > 3 ? ` +${group.members.length - 3} more` : ""}
                </p>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
