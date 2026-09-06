import { deliverInvites } from "./invites"
import { materializeNextSeriesPoll } from "./recurring-series-core"

/**
 * Materialize and send the next occurrence once. A concurrent caller receives
 * the already-created poll with `created: false`, so it never sends a second
 * invitation batch.
 */
export async function advanceRecurringSeries(sourcePollId: string): Promise<string | null> {
  const occurrence = await materializeNextSeriesPoll(sourcePollId)
  if (!occurrence) return null

  if (occurrence.created) {
    await deliverInvites(occurrence.poll, occurrence.poll.participants)
  }
  return occurrence.poll.id
}
