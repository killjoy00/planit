import type { Poll, PollOption, Participant, Vote } from "@/app/generated/prisma/client"
import { VoteChoice } from "@/app/generated/prisma/enums"

type PollWithRelations = Poll & {
  options: PollOption[]
  participants: (Participant & { vote: Vote | null })[]
  votes: Vote[]
}

export function getUnvotedParticipants(
  participants: (Participant & { vote: Vote | null })[]
) {
  return participants.filter((p) => !p.votedAt && !p.optedOut)
}

export function determineWinner(
  poll: PollWithRelations
): PollOption | null {
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

  // For DATE_POLL and SINGLE_CHOICE: option with most votes wins
  const counts = new Map<string, number>()
  for (const option of options) {
    counts.set(option.id, 0)
  }
  for (const vote of votes) {
    if (vote.optionId) {
      counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1)
    }
  }

  let winnerOption: PollOption | null = null
  let maxVotes = 0
  for (const option of options.sort((a, b) => a.order - b.order)) {
    const count = counts.get(option.id) ?? 0
    if (count > maxVotes) {
      maxVotes = count
      winnerOption = option
    }
  }
  return maxVotes > 0 ? winnerOption : null
}

export function checkThreshold(
  poll: Poll,
  votes: Vote[]
): boolean {
  if (!poll.threshold) return false
  if (poll.type === "YES_NO_VETO") {
    const yesCount = votes.filter((v) => v.choice === VoteChoice.YES).length
    return yesCount >= poll.threshold
  }
  // For choice polls: any option reaching threshold
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
