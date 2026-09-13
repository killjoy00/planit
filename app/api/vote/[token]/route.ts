import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkThreshold, isMultiSelect } from "@/lib/poll-logic"
import { CLOSABLE_POLL_INCLUDE, closePollAndAnnounce } from "@/lib/close-poll"
import { MAX_OPTIONS_PER_POLL } from "@/lib/limits"
import { BallotError, commitBallot } from "@/lib/ballot"

const schema = z.object({
  optionIds: z.array(z.string()).max(MAX_OPTIONS_PER_POLL).optional(),
  optionId: z.string().optional(),
  choice: z.enum(["YES", "FINE", "NO"]).optional(),
  preferences: z.array(z.object({
    optionId: z.string(),
    preference: z.enum(["IDEAL", "AVAILABLE"]),
  })).max(MAX_OPTIONS_PER_POLL).optional(),
  knownOptionIds: z.array(z.string()).max(MAX_OPTIONS_PER_POLL).optional(),
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
  OPTIONS_CHANGED: { message: "The choices changed while this ballot was open. Reloading the latest version…", status: 409 },
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
