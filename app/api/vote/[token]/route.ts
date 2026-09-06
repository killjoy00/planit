import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkThreshold, isMultiSelect } from "@/lib/poll-logic"
import { CLOSABLE_POLL_INCLUDE, closePollAndAnnounce } from "@/lib/close-poll"
import { MAX_OPTIONS_PER_POLL } from "@/lib/limits"
import { BallotError, commitBallot } from "@/lib/ballot"

const schema = z.object({
  /** Selections for a choice poll. A date poll may send several. */
  optionIds: z.array(z.string()).max(MAX_OPTIONS_PER_POLL).optional(),
  /** Single-selection form of `optionIds`, still sent by older open tabs. */
  optionId: z.string().optional(),
  choice: z.enum(["YES", "FINE", "NO"]).optional(),
  /** TIME_POLL slots can be ideal or merely workable. Omitted means unavailable. */
  preferences: z.array(z.object({
    optionId: z.string(),
    preference: z.enum(["IDEAL", "AVAILABLE"]),
  })).max(MAX_OPTIONS_PER_POLL).optional(),
})

const ballotMessages: Record<BallotError["code"], { message: string; status: number }> = {
  NOT_FOUND: { message: "Invalid link", status: 404 },
  OPTED_OUT: { message: "Opted out", status: 400 },
  POLL_CLOSED: { message: "Poll is closed", status: 400 },
  CHOICE_REQUIRED: { message: "Choice required", status: 400 },
  OPTION_REQUIRED: { message: "Option required", status: 400 },
  MULTIPLE_NOT_ALLOWED: { message: "Only one option can be selected.", status: 400 },
  AVAILABILITY_REQUIRED: { message: "Mark at least one time as ideal or workable.", status: 400 },
  UNKNOWN_OPTION: { message: "Unknown option.", status: 400 },
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  let committed
  try {
    committed = await commitBallot(token, parsed.data)
  } catch (error) {
    if (error instanceof BallotError) {
      const detail = ballotMessages[error.code]
      // Keep the old, more useful date-poll wording while the shared mutation
      // helper owns the actual validation and serialization.
      if (error.code === "OPTION_REQUIRED") {
        const participant = await db.participant.findUnique({
          where: { token },
          select: { poll: { select: { type: true } } },
        })
        return NextResponse.json(
          { error: participant && isMultiSelect(participant.poll.type) ? "Pick at least one option." : detail.message },
          { status: detail.status },
        )
      }
      return NextResponse.json({ error: detail.message }, { status: detail.status })
    }
    throw error
  }

  // Check the threshold after the atomic replacement. A concurrent close uses
  // the same poll lock and re-fetches the votes before deciding a winner, so
  // this check may be stale without ever making the close stale.
  const allVotes = await db.vote.findMany({ where: { pollId: committed.pollId } })
  const shouldAutoClose = checkThreshold(
    { type: committed.pollType, threshold: committed.threshold },
    allVotes,
  )

  if (shouldAutoClose) {
    const fullPoll = await db.poll.findUnique({
      where: { id: committed.pollId },
      include: CLOSABLE_POLL_INCLUDE,
    })
    if (fullPoll) await closePollAndAnnounce(fullPoll, "threshold")
  }

  return NextResponse.json({ ok: true, changed: committed.changed })
}
