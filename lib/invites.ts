import { db } from "./db"
import { sendInviteEmails, type DeliveryResult, type InviteEmailProps } from "./email"
import { creatorDisplayName } from "./display-name"
import { appUrl } from "./site"
import { formatDateRange, formatTimeSlot } from "./time-zones"

interface InvitePoll {
  id: string
  title: string
  description: string | null
  type: string
  timeZone: string | null
  deadline: Date | null
  replyToCreator: boolean
  options: Array<{ label: string; dateValue: Date | null; endDate: Date | null }>
  creator: { name: string | null; email: string | null }
}

type InviteParticipant = { name: string; email: string; token: string }

function inviteProps(poll: InvitePoll, participants: InviteParticipant[]): InviteEmailProps[] {
  const base = appUrl()
  const creatorName = creatorDisplayName(poll.creator)
  const options = poll.options.map((o) => ({
    label: o.label,
    dateStr: o.dateValue
      ? poll.type === "TIME_POLL" && poll.timeZone
        ? formatTimeSlot(o.dateValue, o.endDate, poll.timeZone)
        : formatDateRange(o.dateValue, o.endDate)
      : undefined,
  }))

  const replyTo = poll.replyToCreator ? poll.creator.email ?? undefined : undefined

  return participants.map((p) => ({
    participantName: p.name,
    participantEmail: p.email,
    creatorName,
    pollTitle: poll.title,
    pollDescription: poll.description ?? undefined,
    pollType: poll.type,
    voteUrl: `${base}/vote/${p.token}`,
    deadline: poll.deadline ?? undefined,
    options,
    unsubscribeUrl: `${base}/api/unsubscribe/${p.token}`,
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
