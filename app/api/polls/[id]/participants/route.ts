import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deliverInvites } from "@/lib/invites"
import { contactSchema, normalizeContacts } from "@/lib/contacts"
import { MAX_INVITEES_PER_POLL, MAX_INVITES_PER_CREATOR_PER_DAY } from "@/lib/limits"

const schema = z.object({
  invitees: z.array(contactSchema).min(1).max(MAX_INVITEES_PER_POLL),
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

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const existingEmails = new Set(poll.participants.map((p) => p.email.toLowerCase()))
  const newInvitees = normalizeContacts(parsed.data.invitees).filter(
    (i) => !existingEmails.has(i.email),
  )

  if (newInvitees.length === 0) {
    return NextResponse.json({ error: "All invitees are already on this poll." }, { status: 400 })
  }
  if (poll.participants.length + newInvitees.length > MAX_INVITEES_PER_POLL) {
    return NextResponse.json({ error: "This poll has reached its participant limit." }, { status: 400 })
  }

  const created = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`poll-send:${session.user.id}`}))`
    const sentRecently = await tx.participant.count({
      where: {
        poll: { creatorId: session.user.id },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (sentRecently + newInvitees.length > MAX_INVITES_PER_CREATOR_PER_DAY) {
      throw new Error("DAILY_INVITE_LIMIT")
    }
    return Promise.all(newInvitees.map((inv) =>
      tx.participant.create({ data: { pollId: poll.id, name: inv.name, email: inv.email } }),
    ))
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "DAILY_INVITE_LIMIT") return null
    throw error
  })

  if (!created) {
    return NextResponse.json({ error: "Daily invitation limit reached. Try again tomorrow." }, { status: 429 })
  }

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const participantId = req.nextUrl.searchParams.get("participantId")
  if (!participantId) return NextResponse.json({ error: "Participant required" }, { status: 400 })

  const poll = await db.poll.findFirst({
    where: { id, creatorId: session.user.id },
    select: { status: true, threshold: true },
  })
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (poll.status !== "OPEN") return NextResponse.json({ error: "Poll is closed" }, { status: 400 })

  const removed = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`poll-participants:${id}`}))`
    const participant = await tx.participant.findFirst({
      where: { id: participantId, pollId: id },
      select: { id: true },
    })
    if (!participant) return false
    await tx.participant.delete({ where: { id: participant.id } })
    const active = await tx.participant.count({ where: { pollId: id, optedOut: false } })
    if (poll.threshold && poll.threshold > active) {
      // Do not silently lower the vote threshold and trigger an unexpected
      // result; turn auto-close off until the creator picks a new value.
      await tx.poll.update({ where: { id }, data: { threshold: null } })
    }
    return true
  })
  if (!removed) return NextResponse.json({ error: "Participant not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
