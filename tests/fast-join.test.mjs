import assert from "node:assert/strict"
import test from "node:test"

import {
  FAST_JOIN_EMAIL_SUFFIX,
  createFastJoinEmail,
  isFastJoinEmail,
  participantContactLabel,
} from "../lib/fast-join.ts"

test("fast-join identities use a reserved non-deliverable address", () => {
  const email = createFastJoinEmail()
  assert.ok(email.endsWith(FAST_JOIN_EMAIL_SUFFIX))
  assert.equal(isFastJoinEmail(email), true)
  assert.equal(participantContactLabel(email), "Joined from share link")
})

test("normal participant emails remain untouched", () => {
  const email = "friend@example.com"
  assert.equal(isFastJoinEmail(email), false)
  assert.equal(participantContactLabel(email), email)
})
