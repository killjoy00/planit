import type { Poll } from "@/app/generated/prisma/client"

const HOUR_MS = 60 * 60 * 1000

/** The three reminder templates, in escalating order. */
export type ReminderLevel = 1 | 2 | 3

/**
 * Hours after the invitations went out.
 *
 * The only schedule available to a poll with no deadline: there is nothing to
 * count back from, so the poll's own age is the best signal there is.
 */
export const AFTER_SEND_HOURS = [24, 48, 96] as const

/**
 * Hours before the deadline.
 *
 * Timed so the last nudge lands with a day still to act on it. A poll created
 * on Monday for a Saturday decision used to go quiet by Friday — the one day
 * the reminder would have worked — because the ladder counted from creation.
 */
export const BEFORE_DEADLINE_HOURS = [72, 48, 24] as const

export interface RemindablePoll {
  createdAt: Date
  deadline: Date | null
  reminderLevel: number
  reminderSchedule: Poll["reminderSchedule"]
}

/**
 * Which schedule this poll actually runs on.
 *
 * `BEFORE_DEADLINE` needs a deadline to count back from. Nothing in the app
 * can currently remove one after the fact, but a poll that reaches the cron
 * without one still has to be nudged rather than skipped forever, so it falls
 * back rather than failing.
 */
export function effectiveSchedule(poll: RemindablePoll): Poll["reminderSchedule"] {
  if (poll.reminderSchedule === "BEFORE_DEADLINE" && poll.deadline) return "BEFORE_DEADLINE"
  return "AFTER_SEND"
}

/**
 * The reminder that is due for this poll now, or `null` for none.
 *
 * Deliberately returns a level rather than a boolean, because the two
 * schedules disagree about what "next" means:
 *
 * - Counting up from the send, each step comes due in order, so the next one is
 *   always `reminderLevel + 1`.
 * - Counting back from the deadline, a poll can be created *inside* the ladder
 *   — set up on Friday night for a Sunday decision and all three steps are
 *   already behind it. Stepping one level per nightly run would send the
 *   gentlest "don't forget" when the deadline is hours away and never reach the
 *   urgent one. So this returns the most urgent step whose moment has passed
 *   and lets the earlier ones lapse: skipping a nudge is cheap, sending the
 *   wrong one is not.
 */
export function dueReminderLevel(poll: RemindablePoll, now: Date): ReminderLevel | null {
  const sent = poll.reminderLevel

  if (effectiveSchedule(poll) === "AFTER_SEND") {
    const next = sent + 1
    if (next > AFTER_SEND_HOURS.length) return null
    const dueAt = poll.createdAt.getTime() + AFTER_SEND_HOURS[next - 1] * HOUR_MS
    return now.getTime() >= dueAt ? (next as ReminderLevel) : null
  }

  const deadline = poll.deadline!.getTime()
  // Past the deadline there is nothing left to remind anyone about; the poll is
  // due to be closed and told the result instead.
  if (now.getTime() >= deadline) return null

  for (let level = BEFORE_DEADLINE_HOURS.length; level >= 1; level--) {
    const dueAt = deadline - BEFORE_DEADLINE_HOURS[level - 1] * HOUR_MS
    if (now.getTime() >= dueAt) return level > sent ? (level as ReminderLevel) : null
  }
  return null
}

/** How the creator's choice reads back to them, e.g. on the poll page. */
export function describeSchedule(poll: RemindablePoll): string {
  if (effectiveSchedule(poll) === "BEFORE_DEADLINE") {
    return `${BEFORE_DEADLINE_HOURS.join("h, ")}h before the deadline`
  }
  return `${AFTER_SEND_HOURS.join("h, ")}h after sending`
}
