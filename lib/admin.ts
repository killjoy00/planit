/**
 * Whether this address may see `/admin`.
 *
 * There is no role column on `User` — the site has exactly one operator, so an
 * env var is the whole access list. Matched case-insensitively since email
 * comparisons elsewhere in the app already are (`EmailSuppression`,
 * `Participant`). Fails closed like `verifyCronSecret`: an unset `ADMIN_EMAIL`
 * means nobody gets in, not everybody.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !email) return false
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase()
}
