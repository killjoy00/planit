import assert from "node:assert/strict"
import test from "node:test"

import { selectTimePollWinner } from "../lib/time-poll.ts"

const options = [
  { id: "early", order: 0 },
  { id: "late", order: 1 },
]

test("time poll winners maximize the number of available participants", () => {
  const winner = selectTimePollWinner(options, [
    { optionId: "early", preference: "IDEAL" },
    { optionId: "late", preference: "AVAILABLE" },
    { optionId: "late", preference: "AVAILABLE" },
  ])
  assert.equal(winner?.id, "late")
})

test("ideal votes break attendance ties", () => {
  const winner = selectTimePollWinner(options, [
    { optionId: "early", preference: "IDEAL" },
    { optionId: "late", preference: "AVAILABLE" },
  ])
  assert.equal(winner?.id, "early")
})

test("creator order breaks complete ties", () => {
  const winner = selectTimePollWinner(options, [
    { optionId: "early", preference: "AVAILABLE" },
    { optionId: "late", preference: "AVAILABLE" },
  ])
  assert.equal(winner?.id, "early")
})
