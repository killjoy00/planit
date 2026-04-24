import { Resend } from "resend"
import { render } from "@react-email/render"
import InviteEmail from "@/emails/invite"
import Reminder1Email from "@/emails/reminder-1"
import Reminder2Email from "@/emails/reminder-2"
import Reminder3Email from "@/emails/reminder-3"
import WinnerEmail from "@/emails/winner"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "planit <noreply@example.com>"

export interface InviteEmailProps {
  participantName: string
  participantEmail: string
  creatorName: string
  pollTitle: string
  pollDescription?: string
  pollType: string
  voteUrl: string
  deadline?: Date
  options: Array<{ label: string; dateStr?: string }>
}

export interface ReminderEmailProps {
  participantName: string
  participantEmail: string
  creatorName: string
  pollTitle: string
  voteUrl: string
  optOutUrl: string
  votedCount: number
  totalCount: number
  pendingNames?: string[]
}

export interface WinnerEmailProps {
  participantName: string
  participantEmail: string
  pollTitle: string
  winnerLabel: string
  resultsUrl: string
  icsUrl?: string
}

export async function sendInviteEmail(props: InviteEmailProps) {
  const html = await render(InviteEmail(props))
  return resend.emails.send({
    from: FROM,
    to: props.participantEmail,
    subject: `${props.pollTitle} — ${props.creatorName} wants your vote`,
    html,
  })
}

export async function sendReminderEmail(
  level: 1 | 2 | 3,
  props: ReminderEmailProps
) {
  const templates = {
    1: Reminder1Email,
    2: Reminder2Email,
    3: Reminder3Email,
  }
  const subjects = {
    1: `Don't forget — ${props.pollTitle} needs your vote`,
    2: `Still waiting on you for ${props.pollTitle}`,
    3: `${props.creatorName} is still waiting on you for ${props.pollTitle}`,
  }
  const html = await render(templates[level](props))
  return resend.emails.send({
    from: FROM,
    to: props.participantEmail,
    subject: subjects[level],
    html,
  })
}

export async function sendWinnerEmail(props: WinnerEmailProps) {
  const html = await render(WinnerEmail(props))
  return resend.emails.send({
    from: FROM,
    to: props.participantEmail,
    subject: `It's decided! ${props.pollTitle} → ${props.winnerLabel}`,
    html,
  })
}
