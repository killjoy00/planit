import { localDateTimeToUtc, utcToLocalInput } from "./time-zones"

export type RecurrenceCadence = "WEEKLY" | "MONTHLY"

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

/** Shift a UTC calendar value without letting Jan 31 overflow into March. */
export function shiftRecurringDate(
  value: Date,
  cadence: RecurrenceCadence,
  interval: number,
): Date {
  const safeInterval = Math.max(1, Math.trunc(interval))
  const shifted = new Date(value)

  if (cadence === "WEEKLY") {
    shifted.setUTCDate(shifted.getUTCDate() + 7 * safeInterval)
    return shifted
  }

  const year = shifted.getUTCFullYear()
  const month = shifted.getUTCMonth()
  const targetIndex = month + safeInterval
  const targetYear = year + Math.floor(targetIndex / 12)
  const targetMonth = ((targetIndex % 12) + 12) % 12
  const targetDay = Math.min(shifted.getUTCDate(), daysInUtcMonth(targetYear, targetMonth))

  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    targetDay,
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
    shifted.getUTCSeconds(),
    shifted.getUTCMilliseconds(),
  ))
}

function shiftLocalInput(value: string, cadence: RecurrenceCadence, interval: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return value
  const [, y, m, d, hh, mm] = match
  const pseudo = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)))
  const shifted = shiftRecurringDate(pseudo, cadence, interval)
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`
}

/**
 * Shift one poll date. Time polls preserve the named-zone wall clock across
 * daylight-saving boundaries; date polls and deadlines use UTC calendar math.
 */
export function shiftPollDate(
  value: Date,
  cadence: RecurrenceCadence,
  interval: number,
  pollType?: string,
  timeZone?: string | null,
): Date {
  if (pollType === "TIME_POLL" && timeZone) {
    const local = utcToLocalInput(value, timeZone)
    const shiftedLocal = shiftLocalInput(local, cadence, interval)
    const shiftedUtc = localDateTimeToUtc(shiftedLocal, timeZone)
    if (shiftedUtc) return shiftedUtc
  }
  return shiftRecurringDate(value, cadence, interval)
}
