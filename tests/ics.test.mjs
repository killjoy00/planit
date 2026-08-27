import assert from "node:assert/strict"
import test from "node:test"

import { generateICS } from "../lib/ics.ts"

test("time polls export timed calendar events", () => {
  const calendar = generateICS(
    "Planning call",
    new Date("2026-08-27T13:30:00.000Z"),
    undefined,
    new Date("2026-08-27T14:30:00.000Z"),
    false,
  )
  assert.match(calendar, /DTSTART:20260827T133000Z/)
  assert.match(calendar, /DTEND:20260827T143000Z/)
  assert.doesNotMatch(calendar, /VALUE=DATE/)
})

test("date polls export inclusive date ranges as all-day events", () => {
  const calendar = generateICS(
    "Weekend",
    new Date("2026-08-28T00:00:00.000Z"),
    undefined,
    new Date("2026-08-30T00:00:00.000Z"),
    true,
  )
  assert.match(calendar, /DTSTART;VALUE=DATE:20260828/)
  assert.match(calendar, /DTEND;VALUE=DATE:20260831/)
})
