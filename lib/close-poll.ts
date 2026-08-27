import type { Poll, PollOption, Participant, Vote } from "@/app/generated/prisma/client"

import { db } from "./db"
import { appUrl } from "./site"
import { creatorDisplayName } from "./display-name"
import { determineWinner } from "./poll-logic"
import { sendWinnerEmails, type DeliveryResult } from "./email"

/**
 * Everything closing a poll needs. `CLOSABLE_POLL_INCLUDE` fetches exactly
 * this, so a caller cannot forget a relation and only find out when the
 * announcement goes out with a blank sender name.
 */
type ClosablePoll = Pick<Poll, "id" | "title" | "type" | "replyToCreator"> & {
  options: PollOption[]
  participants: Participant[]
  votes: Vote[]
  creator: { name: string | null; email: string | null }
}

export const CLOSABLE_POLL_INCLUDE = {
  options: true,
  participants: true,
  votes: true,
  creator: { select: { name: true, email: true } },
} as const

export interface CloseOutcome {
  /** False when someone else closed the poll first; nothing was sent. */
  closed: boolean
  winner: PollOption | null
  delivery: DeliveryResult
}

const NOTHING_SENT: DeliveryResult = { sent: [], failed: [], suppressed: [] }

export async function deliverPollResults(
  poll: ClosablePoll,
  participants: Participant[],
  source: string,
): Promise<DeliveryResult> {
  const winner = determineWinner(poll)
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

/**
 * Close a poll and mail everyone the result.
 *
 * This was written out three times — the last vote crossing a threshold, the
 * creator closing by hand, and the deadline cron — which is three copies of the
 * same recipient filter, the same URL building and the same reply-to rule, free
 * to drift apart. They already had: only one of them guarded on the poll still
 * being open.
 *
 * The write is conditional on the poll still being `OPEN`, and a no-op means
 * some other path got there first. Two people voting at the same instant both
 * used to see the threshold met, both close, and both send everyone a winner
 * email — a duplicate announcement to the whole guest list, from a race that
 * gets likelier the larger the poll.
 */
export async function closePollAndAnnounce(
  poll: ClosablePoll,
  /** Tag for the log line, e.g. "auto-close" — says which path closed it. */
  source: string,
): Promise<CloseOutcome> {
  const winner = determineWinner(poll)

  const { count } = await db.poll.updateMany({
    where: { id: poll.id, status: "OPEN" },
    data: { status: "CLOSED", winnerId: winner?.id ?? null },
  })
  if (count === 0) return { closed: false, winner: null, delivery: NOTHING_SENT }

  if (!winner) return { closed: true, winner: null, delivery: NOTHING_SENT }

  const delivery = await deliverPollResults(poll, poll.participants, source)

  return { closed: true, winner, delivery }
}
