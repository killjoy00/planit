const DATE_ONLY_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})

export const COMMON_TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
] as const

export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

interface LocalParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function parseLocalInput(value: string): LocalParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  }
}

function zonedParts(date: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  }
}

function partsAsUtc(parts: LocalParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
}

/** Convert an HTML datetime-local value in an IANA zone into a real instant. */
export function localDateTimeToUtc(value: string, timeZone: string): Date | null {
  const desired = parseLocalInput(value)
  if (!desired || !isValidTimeZone(timeZone)) return null

  const target = partsAsUtc(desired)
  let guess = target
  // Offset can change around daylight-saving boundaries. Re-evaluating from
  // the adjusted instant converges for ordinary and transition-day inputs.
  for (let i = 0; i < 4; i++) {
    const shown = partsAsUtc(zonedParts(new Date(guess), timeZone))
    const delta = target - shown
    guess += delta
    if (delta === 0) break
  }

  const result = new Date(guess)
  const roundTrip = zonedParts(result, timeZone)
  return partsAsUtc(roundTrip) === target ? result : null
}

/** Turn an instant back into the value expected by a datetime-local input. */
export function utcToLocalInput(value: Date | string, timeZone: string): string {
  const parts = zonedParts(new Date(value), timeZone)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

export function formatDateOnly(value: Date | string, compact = false): string {
  const date = new Date(value)
  if (!compact) return DATE_ONLY_FORMAT.format(date)
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateRange(
  start: Date | string,
  end?: Date | string | null,
  compact = false,
): string {
  const startDate = new Date(start)
  if (!end) return formatDateOnly(startDate, compact)
  const endDate = new Date(end)
  if (startDate.toISOString().slice(0, 10) === endDate.toISOString().slice(0, 10)) {
    return formatDateOnly(startDate, compact)
  }
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
    month: compact ? "short" : "long",
    day: "numeric",
  }
  const fmt = (date: Date) => date.toLocaleDateString("en-US", options)
  return `${fmt(startDate)} – ${fmt(endDate)}, ${endDate.getUTCFullYear()}`
}

export function formatTimeSlot(
  start: Date | string,
  end: Date | string | null | undefined,
  timeZone: string,
): string {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  const date = startDate.toLocaleDateString("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const time = (value: Date) =>
    value.toLocaleTimeString("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })
  return endDate ? `${date}, ${time(startDate)} – ${time(endDate)}` : `${date}, ${time(startDate)}`
}
