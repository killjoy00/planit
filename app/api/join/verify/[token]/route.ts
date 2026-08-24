import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * Turn a verified join request into a participant with a ballot.
 *
 * POST only, for the reason the magic link already documents: a link scanner,
 * a prefetch, or a long-press that fires navigation would otherwise spend the
 * token before the reader ever chose anything. The emailed link points at a
 * page; only its button reaches this.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const request = await db.joinRequest.findUnique({
    where: { token },
    include: { poll: { select: { id: true, status: true } } },
  })
  if (!request) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 })

  if (request.expires < new Date()) {
    await db.joinRequest.delete({ where: { id: request.id } }).catch(() => {})
    return NextResponse.json({ error: "This link has expired. Ask for a new one." }, { status: 400 })
  }
  if (request.poll.status !== "OPEN") {
    return NextResponse.json({ error: "This poll is closed." }, { status: 400 })
  }

  // Someone may have been invited by email in the meantime; that participant
  // already holds a ballot, so reuse it rather than colliding on the unique.
  const existing = await db.participant.findUnique({
    where: { pollId_email: { pollId: request.pollId, email: request.email } },
    select: { token: true },
  })
  if (existing) {
    await db.joinRequest.delete({ where: { id: request.id } }).catch(() => {})
    return NextResponse.json({ ok: true, voteUrl: `/vote/${existing.token}` })
  }

  const [participant] = await db.$transaction([
    db.participant.create({
      data: {
        pollId: request.pollId,
        name: request.name,
        email: request.email,
        // They arrived under their own steam, so there is no invitation to
        // chase — this keeps them out of the creator's "not delivered" list.
        inviteSentAt: new Date(),
      },
    }),
    db.joinRequest.delete({ where: { id: request.id } }),
  ])

  return NextResponse.json({ ok: true, voteUrl: `/vote/${participant.token}` })
}
