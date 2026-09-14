import assert from "node:assert/strict"
import test from "node:test"
import { attributionFromParams, attributionFromUrl, trackedHref } from "../lib/acquisition.ts"

test("normalizes campaign attribution without keeping arbitrary query data", () => {
  const params = new URLSearchParams("utm_source=Reddit%20Ads&utm_campaign=Fall%20Dinner&ignored=secret")
  assert.deepEqual(attributionFromParams(params, "group-dinner"), {
    source: "reddit-ads",
    campaign: "fall-dinner",
    useCase: "group-dinner",
  })
})

test("uses restrained first-party defaults when campaign tags are absent", () => {
  assert.deepEqual(attributionFromParams(new URLSearchParams(), "game-night"), {
    source: "use-case",
    campaign: undefined,
    useCase: "game-night",
  })
  assert.deepEqual(attributionFromParams(new URLSearchParams()), {
    source: "direct",
    campaign: undefined,
    useCase: undefined,
  })
})

test("extracts attribution from a poll-creation referrer", () => {
  assert.deepEqual(
    attributionFromUrl("https://planitnow.us/polls/new?preset=group-dinner&utm_source=Newsletter&utm_campaign=September", "group-dinner"),
    { source: "newsletter", campaign: "september", useCase: "group-dinner" },
  )
  assert.equal(attributionFromUrl("not a url"), null)
})

test("tracked links preserve only supported acquisition tags", () => {
  const href = trackedHref(
    "/polls/new",
    new URLSearchParams("utm_source=reddit&utm_campaign=launch&junk=drop-me"),
    { source: "homepage", useCase: "group-dinner" },
  )
  assert.equal(href, "/polls/new?src=reddit&utm_source=reddit&utm_campaign=launch&preset=group-dinner")
})
