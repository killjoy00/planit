import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deliverInvites, normalizeInvitees } from "@/lib/invites"
import { MAX_DISPLAY_NAME, normalizeDisplayName } from "@/lib/display-name"

const inviteeSchema = z.object({ name: z.string().min(1), email: z.string().email() })

const schema = z.object({
  /** How the creator wants to be named in the invitation. Saved for next time. */
  creatorName: z.string().max(MAX_DISPLAY_NAME).optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["DATE_POLL", "SINGLE_CHOICE", "YES_NO_VETO"]),
  options: z.array(z.object({
    label: z.string().min(1),
    dateValue: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })).min(1),
  groupId: z.string().optional(),
  invitees: z.array(inviteeSchema).min(1),
  deadline: z.string().datetime().optional(),
  threshold: z.number().int().positive().optional(),
  allowSuggestions: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { title, description, type, options, groupId, invitees, deadline, threshold, allowSuggestions } = parsed.data

  // A group's members and the hand-typed extras overlap all the time, and two
  // rows for one address is a unique-constraint failure on the whole create.
  const recipients = normalizeInvitees(invitees)
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Add at least one invitee." }, { status: 400 })
  }

  // Remember the sender's name on the account, so later polls and the reminder
  // cron address people the same way without asking again.
  const displayName = normalizeDisplayName(parsed.data.creatorName)
  if (displayName) {
    await db.user.update({
      where: { id: session.user.id },
      data: { name: displayName },
    })
  }

  const poll = await db.poll.create({
    data: {
      title,
      description,
      type,
      creatorId: session.user.id,
      groupId: groupId || null,
      deadline: deadline ? new Date(deadline) : null,
      threshold: threshold ?? null,
      allowSuggestions: allowSuggestions ?? false,
      options: {
        create: options.map((opt, i) => ({
          label: opt.label,
          dateValue: opt.dateValue ? new Date(opt.dateValue) : null,
          endDate: opt.endDate ? new Date(opt.endDate) : null,
          order: i,
        })),
      },
      participants: {
        create: recipients.map((inv) => ({ name: inv.name, email: inv.email })),
      },
    },
    include: {
      participants: true,
      options: true,
      creator: { select: { name: true, email: true } },
    },
  })

  const delivery = await deliverInvites(poll, poll.participants)

  return NextResponse.json(
    { id: poll.id, invitesSent: delivery.sent.length, invitesFailed: delivery.failed.length },
    { status: 201 },
  )
}
