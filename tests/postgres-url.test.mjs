import assert from "node:assert/strict"
import test from "node:test"

import { hardenPostgresSslMode } from "../lib/postgres-url.ts"

for (const mode of ["prefer", "require", "verify-ca"]) {
  test(`postgres SSL mode ${mode} is made explicitly strict`, () => {
    assert.equal(
      hardenPostgresSslMode(`postgresql://user:pass@example.test/db?sslmode=${mode}&channel_binding=require`),
      "postgresql://user:pass@example.test/db?sslmode=verify-full&channel_binding=require",
    )
  })
}

test("verify-full and URLs without sslmode are unchanged", () => {
  assert.equal(
    hardenPostgresSslMode("postgresql://example.test/db?sslmode=verify-full"),
    "postgresql://example.test/db?sslmode=verify-full",
  )
  assert.equal(
    hardenPostgresSslMode("postgresql://example.test/db"),
    "postgresql://example.test/db",
  )
})

test("explicit libpq compatibility opt-in is preserved", () => {
  const url = "postgresql://example.test/db?uselibpqcompat=true&sslmode=require"
  assert.equal(hardenPostgresSslMode(url), url)
})
