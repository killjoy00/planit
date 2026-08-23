/** Longest sender name we'll accept — keeps email subject lines sane. */
export const MAX_DISPLAY_NAME = 60

/**
 * What participants see as the person behind a poll: "Ryan is planning …".
 *
 * Sign-in is a magic link, so nothing ever asks for a name and `User.name`
 * starts out null. Falling back to the raw address put the creator's full
 * email in every invitation — ugly, and it hands their address to everyone on
 * the guest list. The local part is a much better guess and leaks less, but
 * it is only a fallback: the creator sets a real name when sending a poll.
 */
export function creatorDisplayName(
  user: { name?: string | null; email?: string | null } | null | undefined,
): string {
  const name = user?.name?.trim()
  if (name) return name

  const local = user?.email?.trim().split("@")[0]?.trim()
  return local || "Someone"
}

/** Normalise a submitted display name, or `null` if it is effectively blank. */
export function normalizeDisplayName(value: string | null | undefined): string | null {
  const trimmed = value?.trim().replace(/\s+/g, " ")
  if (!trimmed) return null
  return trimmed.slice(0, MAX_DISPLAY_NAME)
}
