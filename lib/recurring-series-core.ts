import { db } from "./db.ts"
import { normalizeContacts } from "./contacts.ts"
import { shiftPollDate, shiftRecurringDate, type RecurrenceCadence } from "./recurrence.ts"

const NEXT_POLL_INCLUDE = {
  options: { orderBy: { order: "asc" } },
  participants: { orderBy: { createdAt: "asc" } },
  creator: { select: { name: true, email: true } },
} as const

async function findSeriesPoll(id: string) {
  return db.poll.findUnique({ where: { id }, include: NEXT_POLL_INCLUDE })
}

type SeriesPoll = NonNullable<Awaited<ReturnType<typeof findSeriesPoll>>>

export interface MaterializedOccurrence {
  poll: SeriesPoll
  created: boolean
}

/**
 * Create exactly one next occurrence for a recurring series.
 *
 * The unique `(seriesId, seriesSequence)` index is the final backstop, while a
 * transaction-scoped advisory lock lets concurrent close/cancel paths observe
 * the same committed state instead of racing into that constraint.
 */
export async function materializeNextSeriesPoll(
  sourcePollId: string,
): Promise<MaterializedOccurrence | null> {
  const located = await db.poll.findUnique({
    where: { id: sourcePollId },
    select: { seriesId: true },
  })
  if (!located?.seriesId) return null

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`series-mutation:${located.seriesId}`}))`

    const source = await tx.poll.findUnique({
      where: { id: sourcePollId },
      include: {
        series: true,
        options: { orderBy: { order: "asc" } },
        participants: { orderBy: { createdAt: "asc" } },
      },
    })
    if (!source?.series?.active || !source.seriesId || !source.seriesSequence) return null

    const nextSequence = source.seriesSequence + 1
    const existing = await tx.poll.findFirst({
      where: { seriesId: source.seriesId, seriesSequence: nextSequence },
      include: NEXT_POLL_INCLUDE,
    })
    if (existing) return { poll: existing, created: false }

    const cadence = source.series.cadence as RecurrenceCadence
    const interval = source.series.interval
    const recipients = normalizeContacts(
      source.participants
        .filter((participant) => !participant.optedOut)
        .map((participant) => ({ name: participant.name, email: participant.email })),
    )

    const next = await tx.poll.create({
      data: {
        title: source.title,
        description: source.description,
        type: source.type,
        timeZone: source.timeZone,
        creatorId: source.creatorId,
        groupId: source.groupId,
        deadline: source.deadline ? shiftRecurringDate(source.deadline, cadence, interval) : null,
        threshold: source.threshold,
        allowSuggestions: source.allowSuggestions,
        replyToCreator: source.replyToCreator,
        finalLocation: source.finalLocation,
        finalNotes: source.finalNotes,
        reminderSchedule: source.reminderSchedule,
        seriesId: source.seriesId,
        seriesSequence: nextSequence,
        options: {
          create: source.options.map((option) => ({
            label: option.label,
            dateValue: option.dateValue
              ? shiftPollDate(option.dateValue, cadence, interval, source.type, source.timeZone)
              : null,
            endDate: option.endDate
              ? shiftPollDate(option.endDate, cadence, interval, source.type, source.timeZone)
              : null,
            order: option.order,
          })),
        },
        participants: recipients.length > 0
          ? { create: recipients.map((participant) => participant) }
          : undefined,
      },
      include: NEXT_POLL_INCLUDE,
    })

    return { poll: next, created: true }
  })
}
