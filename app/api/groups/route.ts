import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { contactSchema, normalizeContacts } from "@/lib/contacts"

const schema = z.object({
  name: z.string().min(1),
  members: z.array(contactSchema).min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { name, members } = parsed.data

  // Nothing stops someone typing the same address into two rows of the form,
  // and `@@unique([groupId, email])` turned that into a failed create — the
  // whole group lost over a repeated line. Case-only variants were worse: they
  // got through as two members who are one person.
  const roster = normalizeContacts(members)
  if (roster.length === 0) {
    return NextResponse.json({ error: "Add at least one member." }, { status: 400 })
  }

  const group = await db.group.create({
    data: {
      name,
      creatorId: session.user.id,
      members: { create: roster },
    },
  })

  return NextResponse.json({ id: group.id }, { status: 201 })
}
