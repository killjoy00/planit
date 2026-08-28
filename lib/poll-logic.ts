import type { Poll, PollOption, Participant, Vote } from "@/app/generated/prisma/client"
import { VoteChoice } from "@/app/generated/prisma/enums"
import { selectTimePollWinners } from "./time-poll"
import { selectPluralityWinners } from "./winner-candidates"

type PollForWinner = Pick<Poll, "type"> & {
  options: PollOption[]
  votes: Pick<Vote, "optionId" | "choice" | "preference">[]
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

export function determineWinnerCandidates(poll: PollForWinner): PollOption[] {
  const { options, votes, type } = poll

  if (type === "YES_NO_VETO") {
    const yesFineCount = votes.filter(
      (v) => v.choice === VoteChoice.YES || v.choice === VoteChoice.FINE
    ).length
    const noCount = votes.filter((v) => v.choice === VoteChoice.NO).length
    if (noCount > 0) return []
    if (yesFineCount > 0 && options[0]) return [options[0]]
    return []
  }

  if (type === "TIME_POLL") {
    return selectTimePollWinners(options, votes)
  }

  // DATE_POLL and SINGLE_CHOICE: every option with the most votes is a candidate.
  // The organizer, rather than option-entry order, decides a complete tie.
  return selectPluralityWinners(options, votes)
}

export function determineWinner(poll: PollForWinner): PollOption | null {
  return determineWinnerCandidates(poll)[0] ?? null
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
