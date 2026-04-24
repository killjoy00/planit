import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendInviteEmail } from "@/lib/email"

const inviteeSchema = z.object({ name: z.string().min(1), email: z.string().email() })

const schema = z.object({
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
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { title, description, type, options, groupId, invitees, deadline, threshold } = parsed.data

  const poll = await db.poll.create({
    data: {
      title,
      description,
      type,
      creatorId: session.user.id,
      groupId: groupId || null,
      deadline: deadline ? new Date(deadline) : null,
      threshold: threshold ?? null,
      options: {
        create: options.map((opt, i) => ({
          label: opt.label,
          dateValue: opt.dateValue ? new Date(opt.dateValue) : null,
          endDate: opt.endDate ? new Date(opt.endDate) : null,
          order: i,
        })),
      },
      participants: {
        create: invitees.map((inv) => ({ name: inv.name, email: inv.email })),
      },
    },
    include: {
      participants: true,
      options: true,
      creator: { select: { name: true, email: true } },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const creatorName = poll.creator.name ?? poll.creator.email ?? "Someone"

  function formatDateRange(start: Date | null, end: Date | null): string | undefined {
    if (!start) return undefined
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (!end) return start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
  }

  await Promise.allSettled(
    poll.participants.map((p) =>
      sendInviteEmail({
        participantName: p.name,
        participantEmail: p.email,
        creatorName,
        pollTitle: poll.title,
        pollDescription: poll.description ?? undefined,
        pollType: poll.type,
        voteUrl: `${appUrl}/vote/${p.token}`,
        deadline: poll.deadline ?? undefined,
        options: poll.options.map((o) => ({
          label: o.label,
          dateStr: formatDateRange(o.dateValue, o.endDate),
        })),
      })
    )
  )

  return NextResponse.json({ id: poll.id }, { status: 201 })
}
