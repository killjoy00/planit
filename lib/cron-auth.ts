import { timingSafeEqual } from "node:crypto"
import { NextRequest } from "next/server"

const PREFIX = "Bearer "

/**
 * Authorise a scheduled run.
 *
 * Compared byte-for-byte in constant time: the endpoints behind this close
 * polls and mail entire guest lists, the header is attacker-supplied, and a
 * plain `===` leaks how long a shared prefix is. Fails closed when
 * `CRON_SECRET` is unset, so a misconfigured deployment cannot be triggered by
 * an empty token.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = req.headers.get("authorization")
  // Matched as a prefix rather than stripped anywhere in the string, so a
  // token that merely contains "Bearer " is not quietly rewritten.
  if (!header?.startsWith(PREFIX)) return false

  const given = Buffer.from(header.slice(PREFIX.length))
  const expected = Buffer.from(secret)
  if (given.length !== expected.length) return false
  return timingSafeEqual(given, expected)
}
