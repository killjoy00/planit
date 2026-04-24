import ical from "ical-generator"

export function generateICS(
  title: string,
  date: Date,
  description?: string
): string {
  const calendar = ical({ name: "planit" })
  calendar.createEvent({
    start: date,
    end: new Date(date.getTime() + 2 * 60 * 60 * 1000), // 2h default duration
    summary: title,
    description: description ?? "",
  })
  return calendar.toString()
}
