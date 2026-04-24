import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendInviteEmail } from "@/lib/email"

const schema = z.object({
  invitees: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })).min(1),
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
  const newInvitees = parsed.data.invitees.filter((i) => !existingEmails.has(i.email.toLowerCase()))

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const creatorName = poll.creator.name ?? poll.creator.email ?? "Someone"

  function formatDateRange(start: Date | null, end: Date | null): string | undefined {
    if (!start) return undefined
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (!end) return start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
  }

  await Promise.allSettled(
    created.map((p) =>
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

  return NextResponse.json({ added: created.length }, { status: 201 })
}
