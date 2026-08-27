export interface TimePollOption {
  id: string
  order: number
}

export interface TimePollVote {
  optionId: string | null
  preference: "IDEAL" | "AVAILABLE" | null
}

/** Maximize attendance, then ideal votes, then keep the creator's option order. */
export function selectTimePollWinner<T extends TimePollOption>(
  options: T[],
  votes: TimePollVote[],
): T | null {
  let winner: T | null = null
  let bestAvailable = 0
  let bestIdeal = 0

  for (const option of [...options].sort((a, b) => a.order - b.order)) {
    const optionVotes = votes.filter((vote) => vote.optionId === option.id)
    const available = optionVotes.length
    const ideal = optionVotes.filter((vote) => vote.preference === "IDEAL").length
    if (available > bestAvailable || (available === bestAvailable && ideal > bestIdeal)) {
      winner = option
      bestAvailable = available
      bestIdeal = ideal
    }
  }

  return bestAvailable > 0 ? winner : null
}
