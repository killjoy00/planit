import type { PollOption, Participant } from "../app/generated/prisma/client"

import { db } from "./db"
import { appUrl } from "./site"
import { creatorDisplayName } from "./display-name"
import { determineWinner } from "./poll-logic"
import { sendWinnerEmails, type DeliveryResult } from "./email"
import {
  CLOSABLE_POLL_INCLUDE,
  closePollRecord,
  resolvePollTieRecord,
  type ClosablePoll,
} from "./poll-closing"
import { advanceRecurringSeries } from "./recurring-series"

export { CLOSABLE_POLL_INCLUDE } from "./poll-closing"

export interface CloseOutcome {
  /** False when someone else closed the poll first; nothing was sent. */
  closed: boolean
  winner: PollOption | null
  /** More than one top option closed without an organizer selection. */
  needsDecision: boolean
  winnerCandidates: PollOption[]
  delivery: DeliveryResult
  /** Newly-created next occurrence for an active recurring series. */
  nextPollId: string | null
}

const NOTHING_SENT: DeliveryResult = { sent: [], failed: [], suppressed: [] }

export async function deliverPollResults(
  poll: ClosablePoll,
  participants: Participant[],
  source: string,
  selectedWinner?: PollOption,
): Promise<DeliveryResult> {
  const winner = selectedWinner
    ?? poll.options.find((option) => option.id === poll.winnerId)
    ?? determineWinner(poll)
  if (!winner || participants.length === 0) return NOTHING_SENT

  const base = appUrl()
  const creatorName = creatorDisplayName(poll.creator)
  const replyTo = poll.replyToCreator ? poll.creator.email ?? undefined : undefined
  const delivery = await sendWinnerEmails(
    participants
      .filter((participant) => !participant.optedOut)
      .map((participant) => ({
        participantName: participant.name,
        participantEmail: participant.email,
        creatorName,
        pollTitle: poll.title,
        winnerLabel: winner.label,
        finalLocation: poll.finalLocation ?? undefined,
        finalNotes: poll.finalNotes ?? undefined,
        resultsUrl: `${base}/vote/${participant.token}/results`,
        icsUrl: winner.dateValue ? `${base}/api/polls/ics/${poll.id}` : undefined,
        unsubscribeUrl: `${base}/api/unsubscribe/${participant.token}`,
        replyTo,
      })),
  )

  const deliveryWrites = [
    ...(delivery.sent.length > 0
      ? [db.participant.updateMany({
          where: { pollId: poll.id, email: { in: delivery.sent } },
          data: { resultSentAt: new Date(), resultError: null },
        })]
      : []),
    ...delivery.failed.map((failure) => db.participant.updateMany({
      where: { pollId: poll.id, email: failure.email },
      data: { resultSentAt: null, resultError: failure.reason },
    })),
    ...(delivery.suppressed.length > 0
      ? [db.participant.updateMany({
          where: { pollId: poll.id, email: { in: delivery.suppressed } },
          data: { resultSentAt: null, resultError: "Unsubscribed from planit email", optedOut: true },
        })]
      : []),
  ]
  if (deliveryWrites.length > 0) await db.$transaction(deliveryWrites)

  if (delivery.failed.length > 0) {
    console.error(
      `[${source}] poll ${poll.id}: result refused for ${delivery.failed.length} participants`,
      delivery.failed,
    )
  }
  return delivery
}

async function advanceSeriesSafely(pollId: string, source: string): Promise<string | null> {
  try {
    return await advanceRecurringSeries(pollId)
  } catch (error) {
    // Closing the current decision is authoritative even if preparing the next
    // occurrence fails. The series can be retried by closing/cancelling logic
    // only if no next sequence exists, and the unique sequence key prevents a
    // second poll if a retry races with a successful attempt.
    console.error(`[${source}] poll ${pollId}: could not advance recurring series`, error)
    return null
  }
}

/**
 * Close a poll and mail everyone the result.
 *
 * The status transition and winner calculation are delegated to
 * `closePollRecord`, which holds the same advisory lock as ballot replacement
 * and re-fetches votes after acquiring it. A vote and a close therefore have a
 * total order: whichever owns the lock first wins, and the other observes the
 * committed state rather than writing around it.
 */
export async function closePollAndAnnounce(
  poll: ClosablePoll,
  source: string,
  selectedWinnerId?: string,
): Promise<CloseOutcome> {
  const record = await closePollRecord(poll.id, selectedWinnerId)
  if (!record.closed || !record.poll) {
    return {
      closed: false,
      winner: null,
      needsDecision: false,
      winnerCandidates: [],
      delivery: NOTHING_SENT,
      nextPollId: null,
    }
  }

  const delivery = record.winner
    ? await deliverPollResults(record.poll, record.poll.participants, source, record.winner)
    : NOTHING_SENT
  const nextPollId = record.needsDecision
    ? null
    : await advanceSeriesSafely(record.poll.id, source)

  return {
    closed: true,
    winner: record.winner,
    needsDecision: record.needsDecision,
    winnerCandidates: record.winnerCandidates,
    delivery,
    nextPollId,
  }
}

/** Choose the winner of a closed tie and send the announcement exactly once. */
export async function resolvePollTieAndAnnounce(
  poll: ClosablePoll,
  selectedWinnerId: string,
  source: string,
): Promise<CloseOutcome> {
  const record = await resolvePollTieRecord(poll.id, selectedWinnerId)
  if (!record.closed || !record.poll || !record.winner) {
    return {
      closed: false,
      winner: null,
      needsDecision: false,
      winnerCandidates: [],
      delivery: NOTHING_SENT,
      nextPollId: null,
    }
  }

  const delivery = await deliverPollResults(
    record.poll,
    record.poll.participants,
    source,
    record.winner,
  )
  const nextPollId = await advanceSeriesSafely(record.poll.id, source)

  return {
    closed: true,
    winner: record.winner,
    needsDecision: false,
    winnerCandidates: record.winnerCandidates,
    delivery,
    nextPollId,
  }
}
