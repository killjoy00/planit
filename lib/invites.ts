import { db } from "./db"
import { sendInviteEmails, type DeliveryResult, type InviteEmailProps } from "./email"
import { creatorDisplayName } from "./display-name"

export interface Invitee {
  name: string
  email: string
}

/**
 * Trim and case-fold addresses, then drop repeats.
 *
 * The poll wizard concatenates a group's members with any extra invitees typed
 * by hand, so the same person routinely arrives twice. An exact repeat used to
 * violate `@@unique([pollId, email])` and fail the whole poll create — no poll
 * and no invitations for anyone — while one differing only in case slipped
 * through as two participants holding two different vote links.
 */
export function normalizeInvitees(invitees: Invitee[]): Invitee[] {
  const seen = new Set<string>()
  const unique: Invitee[] = []
  for (const invitee of invitees) {
    const email = invitee.email.trim().toLowerCase()
    const name = invitee.name.trim()
    if (!email || !name || seen.has(email)) continue
    seen.add(email)
    unique.push({ name, email })
  }
  return unique
}

interface InvitePoll {
  id: string
  title: string
  description: string | null
  type: string
  deadline: Date | null
  replyToCreator: boolean
  options: Array<{ label: string; dateValue: Date | null; endDate: Date | null }>
  creator: { name: string | null; email: string | null }
}

type InviteParticipant = { name: string; email: string; token: string }

function formatDateRange(start: Date | null, end: Date | null): string | undefined {
  if (!start) return undefined
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  if (!end) {
    return start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
}

function inviteProps(poll: InvitePoll, participants: InviteParticipant[]): InviteEmailProps[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const creatorName = creatorDisplayName(poll.creator)
  const options = poll.options.map((o) => ({
    label: o.label,
    dateStr: formatDateRange(o.dateValue, o.endDate),
  }))

  const replyTo = poll.replyToCreator ? poll.creator.email ?? undefined : undefined

  return participants.map((p) => ({
    participantName: p.name,
    participantEmail: p.email,
    creatorName,
    pollTitle: poll.title,
    pollDescription: poll.description ?? undefined,
    pollType: poll.type,
    voteUrl: `${appUrl}/vote/${p.token}`,
    deadline: poll.deadline ?? undefined,
    options,
    unsubscribeUrl: `${appUrl}/api/unsubscribe/${p.token}`,
    replyTo,
  }))
}

/**
 * Write the provider's verdict onto each participant, so a creator looking at
 * the poll can see who was actually reached and resend to the rest. Without
 * this the only record of a refused invitation is a log line nobody reads.
 */
async function recordDelivery(pollId: string, result: DeliveryResult): Promise<void> {
  const now = new Date()
  await db.$transaction([
    ...(result.sent.length > 0
      ? [
          db.participant.updateMany({
            where: { pollId, email: { in: result.sent } },
            data: { inviteSentAt: now, inviteError: null },
          }),
        ]
      : []),
    ...result.failed.map((f) =>
      db.participant.updateMany({
        where: { pollId, email: f.email },
        data: { inviteSentAt: null, inviteError: f.reason.slice(0, 500) },
      }),
    ),
    // Not a failure and not something to retry — they asked us to stop.
    ...(result.suppressed.length > 0
      ? [
          db.participant.updateMany({
            where: { pollId, email: { in: result.suppressed } },
            data: { inviteSentAt: null, inviteError: "Unsubscribed from planit email", optedOut: true },
          }),
        ]
      : []),
  ])
}

/** Mail the invitation to each participant and record what the provider did. */
export async function deliverInvites(
  poll: InvitePoll,
  participants: InviteParticipant[],
): Promise<DeliveryResult> {
  if (participants.length === 0) return { sent: [], failed: [], suppressed: [] }

  const result = await sendInviteEmails(inviteProps(poll, participants))
  await recordDelivery(poll.id, result)

  if (result.failed.length > 0) {
    console.error(
      `[invites] poll ${poll.id}: ${result.failed.length} of ${participants.length} invitations refused`,
      result.failed,
    )
  }

  return result
}
