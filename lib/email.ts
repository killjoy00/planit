import { Resend } from "resend"
import { render } from "@react-email/render"
import InviteEmail from "@/emails/invite"
import Reminder1Email from "@/emails/reminder-1"
import Reminder2Email from "@/emails/reminder-2"
import Reminder3Email from "@/emails/reminder-3"
import WinnerEmail from "@/emails/winner"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "planit <noreply@example.com>"

/** Resend accepts at most 100 messages per batch call. */
const BATCH_SIZE = 100

/**
 * Resend's default account limit is 2 requests/second. A batch call counts as
 * one request however many messages it carries, so this only has to space out
 * consecutive chunks of a very large send.
 */
const CHUNK_GAP_MS = 600

const MAX_ATTEMPTS = 4

/**
 * Resend error codes worth another attempt. Everything else — a bad `from`
 * address, a malformed recipient, an exhausted quota — fails the same way on
 * every retry, so retrying only delays the report.
 */
const RETRYABLE: ReadonlySet<string> = new Set([
  "rate_limit_exceeded",
  "internal_server_error",
  "application_error",
])

/**
 * `batchValidation: 'permissive'` makes Resend accept the messages it can and
 * report the rest by index, instead of rejecting the whole batch because one
 * address is bad. One typo in a group must not cost everyone else their
 * invitation.
 */
const BATCH_OPTIONS = { batchValidation: "permissive" } as const

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

interface Message {
  to: string
  subject: string
  html: string
  text: string
}

/** Who the provider actually accepted, and why it turned the rest away. */
export interface DeliveryResult {
  sent: string[]
  failed: Array<{ email: string; reason: string }>
}

const EMPTY_RESULT: DeliveryResult = { sent: [], failed: [] }

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Render both parts of a message.
 *
 * HTML-only mail is a long-standing spam signal, and an invitation that lands
 * in spam is indistinguishable, to the person waiting for it, from one that
 * was never sent.
 */
async function renderMessage(
  to: string,
  subject: string,
  element: React.ReactElement,
): Promise<Message> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])
  return { to, subject, html, text }
}

/**
 * Send one batch, retrying the transient rejections.
 *
 * `resend.emails.send` resolves with `{ data: null, error }` rather than
 * throwing, so a caller that only awaits it cannot tell a delivered message
 * from a rejected one. Everything here funnels through the returned
 * `DeliveryResult` instead, so a rejection is a value the caller has to look at.
 */
async function sendChunk(chunk: Message[]): Promise<DeliveryResult> {
  const sent: string[] = []
  const failed: DeliveryResult["failed"] = []

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(750 * 2 ** (attempt - 2))

    let response
    try {
      response = await resend.batch.send(
        chunk.map((m) => ({
          from: FROM,
          to: m.to,
          subject: m.subject,
          html: m.html,
          text: m.text,
        })),
        BATCH_OPTIONS,
      )
    } catch (err) {
      // The request never completed, so nothing in the chunk was sent.
      if (attempt < MAX_ATTEMPTS) continue
      return { sent, failed: chunk.map((m) => ({ email: m.to, reason: reasonOf(err) })) }
    }

    const error = response.error
    if (error) {
      // The call as a whole was rejected — again, nothing was sent.
      if (RETRYABLE.has(error.name) && attempt < MAX_ATTEMPTS) continue
      return { sent, failed: chunk.map((m) => ({ email: m.to, reason: error.message })) }
    }

    // Permissive validation reports the messages it refused by their index in
    // the payload; every other index was accepted.
    const rejected = new Map(response.data.errors?.map((e) => [e.index, e.message]))
    for (const [i, m] of chunk.entries()) {
      const reason = rejected.get(i)
      if (reason === undefined) sent.push(m.to)
      else failed.push({ email: m.to, reason })
    }
    return { sent, failed }
  }

  return { sent, failed }
}

/** Send every message, in provider-sized chunks, and report the outcome. */
async function sendBulk(messages: Message[]): Promise<DeliveryResult> {
  if (messages.length === 0) return EMPTY_RESULT

  const sent: string[] = []
  const failed: DeliveryResult["failed"] = []

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(CHUNK_GAP_MS)
    const outcome = await sendChunk(messages.slice(i, i + BATCH_SIZE))
    sent.push(...outcome.sent)
    failed.push(...outcome.failed)
  }

  return { sent, failed }
}

export async function sendInviteEmails(props: InviteEmailProps[]): Promise<DeliveryResult> {
  const messages = await Promise.all(
    props.map((p) =>
      renderMessage(
        p.participantEmail,
        `${p.pollTitle} — ${p.creatorName} wants your vote`,
        InviteEmail(p),
      ),
    ),
  )
  return sendBulk(messages)
}

export async function sendReminderEmails(
  level: 1 | 2 | 3,
  props: ReminderEmailProps[],
): Promise<DeliveryResult> {
  const templates = {
    1: Reminder1Email,
    2: Reminder2Email,
    3: Reminder3Email,
  }
  const subject = (p: ReminderEmailProps) =>
    ({
      1: `Don't forget — ${p.pollTitle} needs your vote`,
      2: `Still waiting on you for ${p.pollTitle}`,
      3: `${p.creatorName} is still waiting on you for ${p.pollTitle}`,
    })[level]

  const messages = await Promise.all(
    props.map((p) => renderMessage(p.participantEmail, subject(p), templates[level](p))),
  )
  return sendBulk(messages)
}

export async function sendWinnerEmails(props: WinnerEmailProps[]): Promise<DeliveryResult> {
  const messages = await Promise.all(
    props.map((p) =>
      renderMessage(
        p.participantEmail,
        `It's decided! ${p.pollTitle} → ${p.winnerLabel}`,
        WinnerEmail(p),
      ),
    ),
  )
  return sendBulk(messages)
}
