import type { Poll, PollOption, Participant, Vote } from "@/app/generated/prisma/client"
import { VoteChoice } from "@/app/generated/prisma/enums"
import { selectTimePollWinner } from "./time-poll"

type PollForWinner = Pick<Poll, "type"> & {
  options: PollOption[]
  votes: Vote[]
}

/**
 * Whether one participant may select several options at once.
 *
 * A date poll asks "when are you free?", and the honest answer is usually more
 * than one date — so every date that works is a selection of its own. The other
 * types ask for a single decision.
 */
export function isMultiSelect(type: Poll["type"]): boolean {
  return type === "DATE_POLL" || type === "TIME_POLL"
}

export function getUnvotedParticipants(
  participants: Pick<Participant, "votedAt" | "optedOut">[]
) {
  return participants.filter((p) => !p.votedAt && !p.optedOut)
}

export function determineWinner(poll: PollForWinner): PollOption | null {
  const { options, votes, type } = poll

  if (type === "YES_NO_VETO") {
    const yesFineCount = votes.filter(
      (v) => v.choice === VoteChoice.YES || v.choice === VoteChoice.FINE
    ).length
    const noCount = votes.filter((v) => v.choice === VoteChoice.NO).length
    if (noCount > 0) return null
    if (yesFineCount > 0) return options[0] ?? null
    return null
  }

  if (type === "TIME_POLL") {
    return selectTimePollWinner(options, votes)
  }

  // DATE_POLL and SINGLE_CHOICE: the option with the most votes wins. On a date
  // poll each vote row is one person marking themselves available for that
  // date, so this reads as "the date the most people can make". Ties go to the
  // earliest option by `order`.
  const counts = new Map<string, number>()
  for (const option of options) {
    counts.set(option.id, 0)
  }
  for (const vote of votes) {
    if (vote.optionId && counts.has(vote.optionId)) {
      counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1)
    }
  }

  let winnerOption: PollOption | null = null
  let maxVotes = 0
  for (const option of [...options].sort((a, b) => a.order - b.order)) {
    const count = counts.get(option.id) ?? 0
    if (count > maxVotes) {
      maxVotes = count
      winnerOption = option
    }
  }
  return maxVotes > 0 ? winnerOption : null
}

export function checkThreshold(
  poll: Pick<Poll, "type" | "threshold">,
  votes: Vote[]
): boolean {
  if (!poll.threshold) return false
  if (poll.type === "YES_NO_VETO") {
    const yesCount = votes.filter((v) => v.choice === VoteChoice.YES).length
    return yesCount >= poll.threshold
  }
  // Choice polls: any option reaching the threshold. A participant contributes
  // at most one vote per option, so on a date poll this still means "N people
  // are available for that date", not "N selections were made".
  const counts = new Map<string, number>()
  for (const vote of votes) {
    if (vote.optionId) {
      counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1)
    }
  }
  for (const count of counts.values()) {
    if (count >= poll.threshold) return true
  }
  return false
}
