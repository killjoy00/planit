import assert from "node:assert/strict"
import test from "node:test"

import { selectPluralityWinners } from "../lib/winner-candidates.ts"

const options = [
  { id: "first", order: 0 },
  { id: "second", order: 1 },
  { id: "third", order: 2 },
]

test("plurality ties keep every leading option", () => {
  const candidates = selectPluralityWinners(options, [
    { optionId: "first" },
    { optionId: "second" },
  ])

  assert.deepEqual(candidates.map((candidate) => candidate.id), ["first", "second"])
})

test("a unique plurality leader remains the only winner candidate", () => {
  const candidates = selectPluralityWinners(options, [
    { optionId: "first" },
    { optionId: "first" },
    { optionId: "second" },
  ])

  assert.deepEqual(candidates.map((candidate) => candidate.id), ["first"])
})

test("an unanswered poll has no winner candidate", () => {
  assert.deepEqual(selectPluralityWinners(options, []), [])
})
