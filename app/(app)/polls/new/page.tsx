import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PollWizard } from "@/components/poll/PollWizard"

export default async function NewPollPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const groups = await db.group.findMany({
    where: { creatorId: userId },
    include: { members: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New poll</h1>
      <PollWizard groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        members: g.members.map((m) => ({ id: m.id, name: m.name, email: m.email })),
      }))} />
    </div>
  )
}
