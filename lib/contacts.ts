import { z } from "zod"

/**
 * One person on a guest list or in a saved group.
 *
 * Groups and polls collect the same pair from the same kind of form, and both
 * store it under a `@@unique([…, email])`, so both need the same normalising —
 * `lib/invites.ts` had it and the group routes did not.
 */
export interface Contact {
  name: string
  email: string
}

/**
 * One name-and-address pair, as a form submits it.
 *
 * Trimmed and case-folded *before* validating, not after. Addresses are pasted
 * — out of a chat message, a contacts app, a spreadsheet cell — and they
 * arrive with whitespace around them constantly. Validating first rejected the
 * whole request over a single trailing space, so a twelve-person guest list
 * came back as "Invalid email address" with nothing saved and no clue which
 * row was at fault. The join form already got this right; everywhere else
 * validated the raw string.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
})

/**
 * Trim and case-fold addresses, then drop repeats.
 *
 * The poll wizard concatenates a group's members with any extra invitees typed
 * by hand, so the same person routinely arrives twice. An exact repeat used to
 * violate the unique index and fail the whole create — no poll and no
 * invitations for anyone — while one differing only in case slipped through as
 * two rows for one person, holding two different vote links.
 */
export function normalizeContacts(contacts: Contact[]): Contact[] {
  const seen = new Set<string>()
  const unique: Contact[] = []
  for (const contact of contacts) {
    const email = contact.email.trim().toLowerCase()
    const name = contact.name.trim()
    if (!email || !name || seen.has(email)) continue
    seen.add(email)
    unique.push({ name, email })
  }
  return unique
}
