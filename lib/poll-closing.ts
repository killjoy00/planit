import type { Participant, Poll, PollOption, Vote } from "../app/generated/prisma/client"
import { db } from "./db"
import { determineWinnerCandidates } from "./poll-logic"

export const CLOSABLE_POLL_INCLUDE = {
  options: true,
  participants: true,
  votes: true,
  creator: { select: { name: true, email: true } },
} as const

export type ClosablePoll = Poll & {
  options: PollOption[]
  participants: Participant[]
  votes: Vote[]
  creator: { name: string | null; email: string | null }
}

export interface CloseRecordOutcome {
  closed: boolean
  poll: ClosablePoll | null
  winner: PollOption | null
  needsDecision: boolean
  winnerCandidates: PollOption[]
}

export function pollMutationLockKey(pollId: string): string {
  return `poll-mutation:${pollId}`
}

/**
 * Decide and persist a close while holding the same lock used by ballot
 * replacement. The winner is calculated from a fresh snapshot *after* the
 * lock is acquired, so a vote can be either before the close or after it —
 * never written into a poll whose winner was calculated without it.
 */
export async function closePollRecord(
  pollId: string,
  selectedWinnerId?: string,
): Promise<CloseRecordOutcome> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(pollId)}))`

    const poll = await tx.poll.findUnique({
      where: { id: pollId },
      include: CLOSABLE_POLL_INCLUDE,
    })
    if (!poll || poll.status !== "OPEN") {
      return { closed: false, poll: null, winner: null, needsDecision: false, winnerCandidates: [] }
    }

    const winnerCandidates = determineWinnerCandidates(poll)
    const selectedWinner = selectedWinnerId
      ? winnerCandidates.find((option) => option.id === selectedWinnerId)
      : undefined
    if (selectedWinnerId && !selectedWinner) throw new Error("INVALID_WINNER")

    const winner = selectedWinner ?? (winnerCandidates.length === 1 ? winnerCandidates[0] : null)
    await tx.poll.update({
      where: { id: poll.id },
      data: { status: "CLOSED", winnerId: winner?.id ?? null },
    })

    return {
      closed: true,
      poll,
      winner,
      needsDecision: !winner && winnerCandidates.length > 1,
      winnerCandidates,
    }
  })
}

/** Resolve a closed tie once, under the same mutation lock. */
export async function resolvePollTieRecord(
  pollId: string,
  selectedWinnerId: string,
): Promise<CloseRecordOutcome> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(pollId)}))`

    const poll = await tx.poll.findUnique({
      where: { id: pollId },
      include: CLOSABLE_POLL_INCLUDE,
    })
    if (!poll || poll.status !== "CLOSED" || poll.winnerId) {
      return { closed: false, poll: null, winner: null, needsDecision: false, winnerCandidates: [] }
    }

    const winnerCandidates = determineWinnerCandidates(poll)
    const winner = winnerCandidates.find((option) => option.id === selectedWinnerId)
    if (winnerCandidates.length < 2 || !winner) throw new Error("INVALID_WINNER")

    await tx.poll.update({
      where: { id: poll.id },
      data: { winnerId: winner.id },
    })

    return { closed: true, poll, winner, needsDecision: false, winnerCandidates }
  })
}
