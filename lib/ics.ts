import ical from "ical-generator"

export function generateICS(
  title: string,
  startDate: Date,
  description?: string,
  endDate?: Date | null,
  allDay = false,
): string {
  const calendar = ical({ name: "planit" })
  let end: Date
  if (allDay) {
    // RFC 5545 uses an exclusive DTEND for all-day events, while planit stores
    // an inclusive final date. Advance once so a single-day poll ends on the
    // next calendar day and a range includes its final selected date.
    end = new Date(endDate ?? startDate)
    end.setUTCDate(end.getUTCDate() + 1)
    end.setUTCHours(0, 0, 0, 0)
  } else if (endDate) {
    end = endDate
  } else {
    end = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2h default
  }
  calendar.createEvent({
    start: startDate,
    end,
    summary: title,
    description: description ?? "",
    allDay,
  })
  return calendar.toString()
}
