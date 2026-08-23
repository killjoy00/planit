import { db } from "./db"

/**
 * The emailed sign-in link points at this page, not at the Auth.js callback.
 *
 * Auth.js spends a verification token on the *first* GET of
 * `/api/auth/callback/resend`: it calls `adapter.useVerificationToken`, which
 * deletes the row, before anything is rendered. That makes the emailed URL a
 * one-shot resource that anything merely touching it destroys — a long-press
 * that fires navigation, an inbox link scanner, a browser prefetch. The reader
 * then pastes a link that is already dead.
 *
 * `/auth/confirm` is a read-only stop in front of the callback: it looks the
 * token up without spending it, so the link survives every accidental open and
 * only the deliberate button press signs anyone in.
 */
export const CONFIRM_PATH = "/auth/confirm"

/** Auth.js `basePath` for this app (next-auth's default, not @auth/core's). */
const AUTH_BASE_PATH = "/api/auth"

/** Provider id of the magic-link provider configured in `lib/auth.ts`. */
export const MAGIC_LINK_PROVIDER = "resend"

/**
 * The secret Auth.js mixes into the stored token hash.
 *
 * Mirrors how `next-auth` and `@auth/core` resolve it: `AUTH_SECRET` (or the
 * legacy `NEXTAUTH_SECRET`) wins outright, and only when neither is set does
 * `@auth/core` fall back to the rotation form, collecting `AUTH_SECRET_1..3`
 * into an array that gets stringified into the hash input. We pass the result
 * back to the provider as `secret`, so both sides hash the same value whatever
 * the deployment sets.
 */
export function verificationSecret(): string {
  const single = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (single) return single
  return [3, 2, 1]
    .map((i) => process.env[`AUTH_SECRET_${i}`])
    .filter(Boolean)
    .join(",")
}

/**
 * Hash a raw token the way `@auth/core` does before storing or looking it up
 * (`createHash(`${token}${secret}`)` — SHA-256, lowercase hex).
 */
export async function hashVerificationToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(`${token}${verificationSecret()}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

interface LinkParams {
  token: string
  email: string
  callbackUrl?: string | null
}

function linkQuery({ token, email, callbackUrl }: LinkParams): URLSearchParams {
  const params = new URLSearchParams({ token, email })
  if (callbackUrl) params.set("callbackUrl", callbackUrl)
  return params
}

/** Absolute URL of the confirmation page — this is what goes in the email. */
export function buildConfirmUrl(origin: string, params: LinkParams): string {
  return `${origin}${CONFIRM_PATH}?${linkQuery(params)}`
}

/**
 * Relative URL of the Auth.js callback that actually spends the token. Only
 * ever reached from the confirm button, never from the email.
 */
export function buildCallbackUrl(params: LinkParams): string {
  return `${AUTH_BASE_PATH}/callback/${MAGIC_LINK_PROVIDER}?${linkQuery(params)}`
}

export type LinkState = "valid" | "expired" | "spent"

/**
 * Look up a magic-link token *without* consuming it, so the confirm page can
 * tell a live link from a dead one before the reader clicks anything. A row
 * that is gone was either already used or never existed; either way there is
 * nothing to sign in with, so both read as "spent".
 */
export async function peekVerificationToken({
  token,
  email,
}: {
  token: string
  email: string
}): Promise<LinkState> {
  const record = await db.verificationToken.findUnique({
    where: { token: await hashVerificationToken(token) },
  })

  if (!record || record.identifier !== email) return "spent"
  if (record.expires.valueOf() < Date.now()) return "expired"
  return "valid"
}
