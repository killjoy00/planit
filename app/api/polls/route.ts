import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deliverInvites } from "@/lib/invites"
import { contactSchema, normalizeContacts } from "@/lib/contacts"
import { MAX_DISPLAY_NAME, normalizeDisplayName } from "@/lib/display-name"
import {
  MAX_INVITEES_PER_POLL,
  MAX_INVITES_PER_CREATOR_PER_DAY,
  MAX_OPTIONS_PER_POLL,
} from "@/lib/limits"
import { isValidTimeZone } from "@/lib/time-zones"

const schema = z.object({
  /** How the creator wants to be named in the invitation. Saved for next time. */
  creatorName: z.string().max(MAX_DISPLAY_NAME).optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).optional(),
  type: z.enum(["DATE_POLL", "TIME_POLL", "SINGLE_CHOICE", "YES_NO_VETO"]),
  timeZone: z.string().trim().max(100).optional(),
  options: z.array(z.object({
    label: z.string().trim().min(1).max(200),
    dateValue: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })).min(1).max(MAX_OPTIONS_PER_POLL),
  groupId: z.string().optional(),
  // Email invitations are optional: a creator may make the poll first and
  // distribute its public join link through chat, text, or a native share sheet.
  invitees: z.array(contactSchema).max(MAX_INVITEES_PER_POLL),
  deadline: z.string().datetime().optional(),
  threshold: z.number().int().positive().max(MAX_INVITEES_PER_POLL).optional(),
  allowSuggestions: z.boolean().optional(),
  replyToCreator: z.boolean().optional(),
  /** How nudges are timed. Counting back from a deadline needs one to exist. */
  reminderSchedule: z.enum(["AFTER_SEND", "BEFORE_DEADLINE"]).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { title, description, type, timeZone, options, groupId, invitees, deadline, threshold, allowSuggestions, replyToCreator, reminderSchedule } = parsed.data

  // A group's members and the hand-typed extras overlap all the time, and two
  // rows for one address is a unique-constraint failure on the whole create.
  const recipients = normalizeContacts(invitees)
  if (deadline && new Date(deadline) <= new Date()) {
    return NextResponse.json({ error: "The deadline must be in the future." }, { status: 400 })
  }
  if (type === "TIME_POLL") {
    if (!isValidTimeZone(timeZone)) {
      return NextResponse.json({ error: "Choose a valid IANA time zone." }, { status: 400 })
    }
    if (options.some((option) => !option.dateValue || !option.endDate || new Date(option.endDate) <= new Date(option.dateValue))) {
      return NextResponse.json({ error: "Every time slot needs a valid start and end." }, { status: 400 })
    }
  }
  if (type === "DATE_POLL" && options.some((option) => !option.dateValue)) {
    return NextResponse.json({ error: "Every date option needs a date." }, { status: 400 })
  }
  if (allowSuggestions && type !== "SINGLE_CHOICE") {
    return NextResponse.json({ error: "Suggestions are only available for choice polls." }, { status: 400 })
  }

  // Rejected rather than quietly downgraded: a creator who picked
  // "before the deadline" and got silent creation-time nudges instead would
  // have no way to tell until the reminders landed at the wrong moment.
  if (reminderSchedule === "BEFORE_DEADLINE" && !deadline) {
    return NextResponse.json(
      { error: "Reminders before the deadline need a deadline." },
      { status: 400 },
    )
  }

  // Remember the sender's name on the account, so later polls and the reminder
  // cron address people the same way without asking again.
  const displayName = normalizeDisplayName(parsed.data.creatorName)
  const poll = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`poll-send:${session.user.id}`}))`

    const sentRecently = await tx.participant.count({
      where: {
        poll: { creatorId: session.user.id },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (sentRecently + recipients.length > MAX_INVITES_PER_CREATOR_PER_DAY) {
      throw new Error("DAILY_INVITE_LIMIT")
    }

    if (groupId) {
      const ownedGroup = await tx.group.findFirst({ where: { id: groupId, creatorId: session.user.id } })
      if (!ownedGroup) throw new Error("GROUP_NOT_FOUND")
    }

    if (displayName) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { name: displayName },
      })
    }

    return tx.poll.create({
      data: {
        title,
        description,
        type,
        timeZone: type === "TIME_POLL" ? timeZone : null,
        creatorId: session.user.id,
        groupId: groupId || null,
        deadline: deadline ? new Date(deadline) : null,
        threshold: threshold ?? null,
        allowSuggestions: type === "SINGLE_CHOICE" ? allowSuggestions ?? false : false,
        replyToCreator: replyToCreator ?? false,
        reminderSchedule: reminderSchedule ?? "AFTER_SEND",
        options: {
          create: options.map((opt, i) => ({
            label: opt.label,
            dateValue: opt.dateValue ? new Date(opt.dateValue) : null,
            endDate: opt.endDate ? new Date(opt.endDate) : null,
            order: i,
          })),
        },
        participants: recipients.length > 0
          ? { create: recipients.map((inv) => ({ name: inv.name, email: inv.email })) }
          : undefined,
      },
      include: {
        participants: true,
        options: true,
        creator: { select: { name: true, email: true } },
      },
    })
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "DAILY_INVITE_LIMIT") return null
    if (error instanceof Error && error.message === "GROUP_NOT_FOUND") return undefined
    throw error
  })

  if (poll === null) {
    return NextResponse.json({ error: "Daily invitation limit reached. Try again tomorrow." }, { status: 429 })
  }
  if (poll === undefined) {
    return NextResponse.json({ error: "That group was not found." }, { status: 404 })
  }

  const delivery = await deliverInvites(poll, poll.participants)

  return NextResponse.json(
    { id: poll.id, invitesSent: delivery.sent.length, invitesFailed: delivery.failed.length },
    { status: 201 },
  )
}
