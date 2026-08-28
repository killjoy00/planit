export interface TimePollOption {
  id: string
  order: number
}

export interface TimePollVote {
  optionId: string | null
  preference: "IDEAL" | "AVAILABLE" | null
}

/** Maximize attendance, then ideal votes, while preserving every complete tie. */
export function selectTimePollWinners<T extends TimePollOption>(
  options: T[],
  votes: TimePollVote[],
): T[] {
  let winners: T[] = []
  let bestAvailable = 0
  let bestIdeal = 0

  for (const option of [...options].sort((a, b) => a.order - b.order)) {
    const optionVotes = votes.filter((vote) => vote.optionId === option.id)
    const available = optionVotes.length
    const ideal = optionVotes.filter((vote) => vote.preference === "IDEAL").length
    if (available > bestAvailable || (available === bestAvailable && ideal > bestIdeal)) {
      winners = [option]
      bestAvailable = available
      bestIdeal = ideal
    } else if (available > 0 && available === bestAvailable && ideal === bestIdeal) {
      winners.push(option)
    }
  }

  return bestAvailable > 0 ? winners : []
}

/** Compatibility helper for displays that need one deterministic leader. */
export function selectTimePollWinner<T extends TimePollOption>(
  options: T[],
  votes: TimePollVote[],
): T | null {
  return selectTimePollWinners(options, votes)[0] ?? null
}
