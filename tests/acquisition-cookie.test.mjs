import assert from "node:assert/strict"
import test from "node:test"
import { attributionFromRequest, parseAttribution, serializeAttribution } from "../lib/acquisition-cookie.ts"

test("normalizes first-party attribution labels", () => {
  const params = new URLSearchParams("utm_source=Reddit%20Ads&utm_campaign=Fall%20Dinner")
  assert.deepEqual(attributionFromRequest(params, "group-dinner"), {
    source: "reddit-ads",
    campaign: "fall-dinner",
    useCase: "group-dinner",
  })
})

test("preserves external source while entering a use-case page", () => {
  assert.deepEqual(attributionFromRequest(new URLSearchParams(), "game-night", { source: "newsletter", campaign: "september" }), {
    source: "newsletter",
    campaign: "september",
    useCase: "game-night",
  })
})

test("round trips the compact attribution cookie", () => {
  const value = { source: "reddit", campaign: "launch", useCase: "group-dinner" }
  assert.deepEqual(parseAttribution(serializeAttribution(value)), value)
})
