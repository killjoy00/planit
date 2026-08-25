import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deliverInvites } from "@/lib/invites"
import { contactSchema, normalizeContacts } from "@/lib/contacts"

const schema = z.object({
  invitees: z.array(contactSchema).min(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      participants: { select: { email: true } },
      options: true,
      creator: { select: { name: true, email: true } },
    },
  })

  if (!poll || poll.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "Poll is closed" }, { status: 400 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const existingEmails = new Set(poll.participants.map((p) => p.email.toLowerCase()))
  const newInvitees = normalizeContacts(parsed.data.invitees).filter(
    (i) => !existingEmails.has(i.email),
  )

  if (newInvitees.length === 0) {
    return NextResponse.json({ error: "All invitees are already on this poll." }, { status: 400 })
  }

  const created = await db.$transaction(
    newInvitees.map((inv) =>
      db.participant.create({
        data: { pollId: poll.id, name: inv.name, email: inv.email },
      })
    )
  )

  const delivery = await deliverInvites(poll, created)
  if (delivery.sent.length === 0) {
    return NextResponse.json(
      { error: "Added, but the invitation could not be sent. Try resending from the poll." },
      { status: 502 },
    )
  }

  return NextResponse.json(
    { added: created.length, invitesSent: delivery.sent.length, invitesFailed: delivery.failed.length },
    { status: 201 },
  )
}
