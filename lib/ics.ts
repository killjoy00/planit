import ical from "ical-generator"

export function generateICS(
  title: string,
  startDate: Date,
  description?: string,
  endDate?: Date | null
): string {
  const calendar = ical({ name: "planit" })
  let end: Date
  if (endDate) {
    // Multi-day: end is midnight of the day after endDate (exclusive)
    end = new Date(endDate)
    end.setDate(end.getDate() + 1)
    end.setHours(0, 0, 0, 0)
  } else {
    end = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2h default
  }
  calendar.createEvent({
    start: startDate,
    end,
    summary: title,
    description: description ?? "",
    allDay: !!endDate,
  })
  return calendar.toString()
}
