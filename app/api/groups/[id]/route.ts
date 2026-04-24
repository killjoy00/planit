import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1),
  keepMemberIds: z.array(z.string()),
  addMembers: z.array(z.object({ name: z.string().min(1), email: z.string().email() })),
})

async function getGroupForUser(id: string, userId: string) {
  const group = await db.group.findUnique({ where: { id } })
  if (!group || group.creatorId !== userId) return null
  return group
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const group = await getGroupForUser(id, session.user.id)
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { name, keepMemberIds, addMembers } = parsed.data

  await db.$transaction([
    db.group.update({ where: { id }, data: { name } }),
    db.groupMember.deleteMany({ where: { groupId: id, id: { notIn: keepMemberIds } } }),
    ...(addMembers.length > 0
      ? [db.groupMember.createMany({ data: addMembers.map((m) => ({ ...m, groupId: id })), skipDuplicates: true })]
      : []),
  ])

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const group = await getGroupForUser(id, session.user.id)
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.group.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
