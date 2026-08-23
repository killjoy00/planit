import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PollWizard } from "@/components/poll/PollWizard"
import { creatorDisplayName } from "@/lib/display-name"

export default async function NewPollPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [groups, user] = await Promise.all([
    db.group.findMany({
      where: { creatorId: userId },
      include: { members: true },
      orderBy: { name: "asc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
  ])

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New poll</h1>
      <PollWizard
        defaultCreatorName={creatorDisplayName(user)}
        hasSavedName={!!user?.name?.trim()}
        groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        members: g.members.map((m) => ({ id: m.id, name: m.name, email: m.email })),
      }))} />
    </div>
  )
}
