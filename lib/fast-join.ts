import { randomUUID } from "node:crypto"

export const FAST_JOIN_EMAIL_SUFFIX = "@fast.invalid"

/**
 * Fast-join participants deliberately do not supply an email address. The
 * existing Participant schema requires one, so give these rows an internal,
 * RFC-reserved .invalid address that can never receive mail. Every delivery
 * path filters this suffix before calling the mail provider.
 */
export function createFastJoinEmail(): string {
  return `fast-${randomUUID()}${FAST_JOIN_EMAIL_SUFFIX}`
}

export function isFastJoinEmail(email: string): boolean {
  return email.toLowerCase().endsWith(FAST_JOIN_EMAIL_SUFFIX)
}

export function participantContactLabel(email: string): string {
  return isFastJoinEmail(email) ? "Joined from share link" : email
}
