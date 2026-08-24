import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * RFC 8058 One-Click unsubscribe, the address named in `List-Unsubscribe`.
 *
 * POST is the mail client acting on a deliberate tap, so it takes effect
 * immediately with no confirmation step — that is what the spec requires, and
 * a reader who cannot leave in one tap reaches for report-spam instead.
 *
 * This is global and permanent, unlike `Participant.optedOut`, which only
 * means "count me out of this one plan".
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    select: { email: true },
  })
  // Always 200: a mail client retrying a failed unsubscribe is worse than a
  // no-op, and the token is unguessable, so there is nothing to enumerate.
  if (!participant) return NextResponse.json({ ok: true })

  const email = participant.email.trim().toLowerCase()
  await db.$transaction([
    db.emailSuppression.upsert({
      where: { email },
      create: { email, reason: "one-click" },
      update: {},
    }),
    // Nothing further is owed on the polls they are already on either.
    db.participant.updateMany({ where: { email }, data: { optedOut: true } }),
  ])

  return NextResponse.json({ ok: true })
}

/**
 * Never unsubscribe on GET.
 *
 * The same hazard the magic link avoids: a long-press that fires navigation,
 * an inbox link scanner or a browser prefetch would silently unsubscribe
 * someone who never chose to leave. Reads send the reader to a page that asks.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return NextResponse.redirect(new URL(`/vote/${token}/unsubscribe`, req.url))
}
