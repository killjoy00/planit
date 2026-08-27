import { headers } from "next/headers"

import { db } from "./db"

/**
 * One address may be sent a fresh sign-in link only this often.
 *
 * The same 60 seconds the join form already uses, and for the same reason: a
 * refresh, a double-tap, or a script should not turn into a second message.
 */
export const ADDRESS_COOLDOWN_MS = 60 * 1000

/** …and only this many in a day, so a slow drip is bounded too. */
export const ADDRESS_MAX_PER_DAY = 5

/**
 * One source may trigger this many sends an hour, however many different
 * addresses it cycles through. The per-address limits alone do nothing against
 * a bomber working through a list, which is the shape this abuse actually
 * takes.
 */
export const SOURCE_MAX_PER_HOUR = 15

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Anything older than this is past every window above and can be deleted. */
export const PRUNE_AFTER_MS = 2 * DAY_MS

export type SignInRefusal = "cooldown" | "address-quota" | "source-quota"

/**
 * The caller's address, as far as we can tell behind a proxy.
 *
 * `x-forwarded-for` is a list appended to hop by hop; the first entry is the
 * original client. It is spoofable in general, but on Vercel the platform
 * rewrites it, and a bomber who forges it still trips the per-address limits.
 * Null rather than a guess when there is no header — an absent source must not
 * collide with a real one.
 */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers()
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0]?.trim() || null
    return h.get("x-real-ip")?.trim() || null
  } catch {
    // Called outside a request scope (a script, a test). No source to attribute.
    return null
  }
}

/**
 * Whether we may send a sign-in link to this address now.
 *
 * Checked before Auth.js mints a token or calls the mailer, so a refusal costs
 * nothing and leaves no orphan token behind.
 */
export async function refuseSignIn(
  email: string,
  ip: string | null,
  now: Date = new Date(),
): Promise<SignInRefusal | null> {
  const address = email.trim().toLowerCase()

  const [recent, todayCount] = await Promise.all([
    db.signInAttempt.findFirst({
      where: { email: address },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.signInAttempt.count({
      where: { email: address, createdAt: { gte: new Date(now.getTime() - DAY_MS) } },
    }),
  ])

  if (recent && now.getTime() - recent.createdAt.getTime() < ADDRESS_COOLDOWN_MS) {
    return "cooldown"
  }
  if (todayCount >= ADDRESS_MAX_PER_DAY) return "address-quota"

  if (ip) {
    const fromSource = await db.signInAttempt.count({
      where: { ip, createdAt: { gte: new Date(now.getTime() - HOUR_MS) } },
    })
    if (fromSource >= SOURCE_MAX_PER_HOUR) return "source-quota"
  }

  return null
}

/** Record a send, so the limits above can see it. */
export async function recordSignInAttempt(email: string, ip: string | null): Promise<void> {
  await db.signInAttempt.create({
    data: { email: email.trim().toLowerCase(), ip },
  })
}

/** Drop rows past every window. Called from the daily cron. */
export async function pruneSignInAttempts(now: Date = new Date()): Promise<number> {
  const { count } = await db.signInAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - PRUNE_AFTER_MS) } },
  })
  return count
}
