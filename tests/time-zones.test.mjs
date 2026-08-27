import assert from "node:assert/strict"
import test from "node:test"

import {
  formatDateOnly,
  formatTimeSlot,
  localDateTimeToUtc,
  utcToLocalInput,
} from "../lib/time-zones.ts"

test("date-only values render on their stored UTC calendar day", () => {
  assert.equal(formatDateOnly("2026-01-02T00:00:00.000Z"), "Friday, January 2, 2026")
})

test("named-zone local times round-trip through UTC", () => {
  const instant = localDateTimeToUtc("2026-08-27T09:30", "America/New_York")
  assert.equal(instant?.toISOString(), "2026-08-27T13:30:00.000Z")
  assert.equal(utcToLocalInput(instant, "America/New_York"), "2026-08-27T09:30")
})

test("nonexistent daylight-saving times are rejected", () => {
  assert.equal(localDateTimeToUtc("2026-03-08T02:30", "America/New_York"), null)
})

test("time-slot labels retain the poll's named time zone", () => {
  const label = formatTimeSlot(
    "2026-08-27T13:30:00.000Z",
    "2026-08-27T14:30:00.000Z",
    "America/New_York",
  )
  assert.match(label, /Aug 27, 2026/)
  assert.match(label, /9:30 AM/)
  assert.match(label, /10:30 AM/)
})
