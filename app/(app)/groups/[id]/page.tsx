import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { GroupEditor } from "@/components/group/GroupEditor"

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session!.user!.id!

  const group = await db.group.findUnique({
    where: { id },
    include: { members: { orderBy: { createdAt: "asc" } } },
  })

  if (!group || group.creatorId !== userId) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit group</h1>
      <GroupEditor group={group} />
    </div>
  )
}
