import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  members: z
    .array(z.object({ name: z.string().min(1), email: z.string().email() }))
    .min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { name, members } = parsed.data

  const group = await db.group.create({
    data: {
      name,
      creatorId: session.user.id,
      members: { create: members },
    },
  })

  return NextResponse.json({ id: group.id }, { status: 201 })
}
