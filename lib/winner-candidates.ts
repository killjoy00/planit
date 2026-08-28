export interface OrderedOption {
  id: string
  order: number
}

export interface OptionVote {
  optionId: string | null
}

/** Return every option tied for the highest positive vote count. */
export function selectPluralityWinners<T extends OrderedOption>(
  options: T[],
  votes: OptionVote[],
): T[] {
  const counts = new Map(options.map((option) => [option.id, 0]))
  for (const vote of votes) {
    if (vote.optionId && counts.has(vote.optionId)) {
      counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1)
    }
  }

  const maxVotes = Math.max(0, ...counts.values())
  if (maxVotes === 0) return []
  return [...options]
    .sort((a, b) => a.order - b.order)
    .filter((option) => counts.get(option.id) === maxVotes)
}
