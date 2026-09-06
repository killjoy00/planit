import assert from "node:assert/strict"
import test from "node:test"

import { shiftPollDate, shiftRecurringDate } from "../lib/recurrence.ts"

test("monthly recurrence clamps the day instead of overflowing the month", () => {
  assert.equal(
    shiftRecurringDate(new Date("2027-01-31T18:30:00.000Z"), "MONTHLY", 1).toISOString(),
    "2027-02-28T18:30:00.000Z",
  )
  assert.equal(
    shiftRecurringDate(new Date("2028-01-31T18:30:00.000Z"), "MONTHLY", 1).toISOString(),
    "2028-02-29T18:30:00.000Z",
  )
})

test("weekly recurrence preserves the wall clock for named-zone time polls across DST", () => {
  // 9am New York is 14:00Z before the spring transition and 13:00Z after it.
  const next = shiftPollDate(
    new Date("2026-03-07T14:00:00.000Z"),
    "WEEKLY",
    1,
    "TIME_POLL",
    "America/New_York",
  )
  assert.equal(next.toISOString(), "2026-03-14T13:00:00.000Z")
})

test("weekly recurrence advances by whole calendar weeks", () => {
  assert.equal(
    shiftRecurringDate(new Date("2026-09-06T15:00:00.000Z"), "WEEKLY", 2).toISOString(),
    "2026-09-20T15:00:00.000Z",
  )
})
