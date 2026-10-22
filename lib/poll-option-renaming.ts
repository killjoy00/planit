import { db } from "./db.ts"
import { pollMutationLockKey } from "./poll-closing.ts"

export type RenameOptionErrorCode = "NOT_FOUND" | "NOT_EDITABLE" | "VOTING_STARTED" | "INVALID_LABEL"

export class RenameOptionError extends Error {
  readonly code: RenameOptionErrorCode

  constructor(code: RenameOptionErrorCode) {
    super(code)
    this.code = code
  }
}

/**
 * Rename an existing option without changing its identity, dates, order, or votes.
 * Sharing the poll mutation lock with voting/closing prevents a rename from
 * slipping in after the first ballot.
 */
export async function renamePollOption(pollId: string, creatorId: string, optionId: string, label: string) {
  const trimmed = label.trim()
  if (!trimmed || trimmed.length > 200) throw new RenameOptionError("INVALID_LABEL")

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pollMutationLockKey(pollId)}))`

    const poll = await tx.poll.findFirst({
      where: { id: pollId, creatorId },
      select: { type: true, status: true },
    })
    if (!poll) throw new RenameOptionError("NOT_FOUND")
    if (poll.status !== "OPEN" || poll.type === "YES_NO_VETO") {
      throw new RenameOptionError("NOT_EDITABLE")
    }

    const option = await tx.pollOption.findFirst({
      where: { id: optionId, pollId },
      select: { id: true, label: true },
    })
    if (!option) throw new RenameOptionError("NOT_FOUND")

    const voted = await tx.participant.count({
      where: { pollId, votedAt: { not: null } },
    })
    if (voted > 0) throw new RenameOptionError("VOTING_STARTED")

    if (option.label === trimmed) return option
    return tx.pollOption.update({
      where: { id: optionId },
      data: { label: trimmed },
      select: { id: true, label: true },
    })
  })
}
