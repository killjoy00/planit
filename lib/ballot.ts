import { db } from "./db"
import { isMultiSelect } from "./poll-logic"
import { pollMutationLockKey } from "./poll-closing"

export type BallotErrorCode =
  | "NOT_FOUND"
  | "OPTED_OUT"
  | "POLL_CLOSED"
  | "CHOICE_REQUIRED"
  | "OPTION_REQUIRED"
  | "MULTIPLE_NOT_ALLOWED"
  | "AVAILABILITY_REQUIRED"
  | "UNKNOWN_OPTION"

export class BallotError extends Error {
  constructor(public readonly code: BallotErrorCode) {
    super(code)
  }
}

export interface BallotInput {
  optionIds?: string[]
  optionId?: string
  choice?: "YES" | "FINE" | "NO"
  preferences?: Array<{
    optionId: string
    preference: "IDEAL" | "AVAILABLE"
  }>
}

/**
 * Replace a participant's whole ballot atomically.
 *
 * The token lookup happens once to discover the poll lock. Everything that can
 * change the answer — poll status, valid options, the old ballot and the new
 * ballot — is then checked/written again while that poll-wide advisory lock is
 * held. Two tabs become last-write-wins instead of combining into an impossible
 * single-choice ballot, and a close can no longer race a late vote.
 */
export async function commitBallot(token: string, input: BallotInput) {
  const located = await db.participant.findUnique({
    where: { token },
    select: { id: true, pollId: true },
  })
  if (!located) throw new BallotError("NOT_FOUND")

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(located.pollId)}))`

    const participant = await tx.participant.findUnique({
      where: { id: located.id },
      include: { poll: { include: { options: true } } },
    })
    if (!participant) throw new BallotError("NOT_FOUND")
    if (participant.optedOut) throw new BallotError("OPTED_OUT")
    if (participant.poll.status !== "OPEN") throw new BallotError("POLL_CLOSED")

    const selectedIds = [
      ...new Set(input.optionIds ?? (input.optionId ? [input.optionId] : [])),
    ]
    const preferences = [...new Map(
      (input.preferences ?? []).map((item) => [item.optionId, item]),
    ).values()]
    const validIds = new Set(participant.poll.options.map((option) => option.id))

    if (participant.poll.type === "YES_NO_VETO") {
      if (!input.choice) throw new BallotError("CHOICE_REQUIRED")
    } else if (participant.poll.type === "TIME_POLL") {
      if (preferences.length === 0) throw new BallotError("AVAILABILITY_REQUIRED")
      if (preferences.some(({ optionId }) => !validIds.has(optionId))) {
        throw new BallotError("UNKNOWN_OPTION")
      }
    } else {
      if (selectedIds.length === 0) throw new BallotError("OPTION_REQUIRED")
      if (!isMultiSelect(participant.poll.type) && selectedIds.length > 1) {
        throw new BallotError("MULTIPLE_NOT_ALLOWED")
      }
      if (selectedIds.some((optionId) => !validIds.has(optionId))) {
        throw new BallotError("UNKNOWN_OPTION")
      }
    }

    const isChange = participant.votedAt !== null
    await tx.vote.deleteMany({ where: { participantId: participant.id } })
    await tx.vote.createMany({
      data:
        participant.poll.type === "YES_NO_VETO"
          ? [{
              participantId: participant.id,
              pollId: participant.pollId,
              optionId: null,
              choice: input.choice ?? null,
            }]
          : participant.poll.type === "TIME_POLL"
            ? preferences.map(({ optionId, preference }) => ({
                participantId: participant.id,
                pollId: participant.pollId,
                optionId,
                choice: null,
                preference,
              }))
            : selectedIds.map((optionId) => ({
                participantId: participant.id,
                pollId: participant.pollId,
                optionId,
                choice: null,
                preference: null,
              })),
    })
    await tx.participant.update({
      where: { id: participant.id },
      data: { votedAt: new Date(), tokenUsed: true },
    })

    return {
      changed: isChange,
      pollId: participant.pollId,
      pollType: participant.poll.type,
      threshold: participant.poll.threshold,
    }
  })
}
