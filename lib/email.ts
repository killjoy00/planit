import { Resend } from "resend"
import { render } from "@react-email/render"
import InviteEmail from "@/emails/invite"
import Reminder1Email from "@/emails/reminder-1"
import Reminder2Email from "@/emails/reminder-2"
import Reminder3Email from "@/emails/reminder-3"
import WinnerEmail from "@/emails/winner"

import { db } from "./db"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "planit <noreply@example.com>"

/** Split `Name <addr@host>` into its parts; a bare address has no name. */
function parseSender(value: string): { name: string; address: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (!match) return { name: "planit", address: value.trim() }
  return { name: match[1].replace(/^"|"$/g, "").trim() || "planit", address: match[2].trim() }
}

const SENDER = parseSender(FROM)

/**
 * Strip anything that could end a display name early.
 *
 * The name comes from whatever a creator typed for themselves, and it is
 * interpolated into a From header. A stray quote, angle bracket or newline
 * there can forge a second address or an entire extra header field, so the
 * conservative set is everything that is not one of those.
 */
function safeDisplayName(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/["\\<>,;:@]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
}

/**
 * Who the message appears to come from.
 *
 * A name the reader recognises is the strongest single influence on whether
 * mail gets opened rather than reported, so an invitation from Ada arrives as
 * "Ada via planit" instead of a generic brand name. The address is unchanged —
 * it still has to be one the domain is authorised to send from.
 */
function senderFor(name: string | undefined): string {
  const safe = name ? safeDisplayName(name) : ""
  if (!safe) return FROM
  return `${safe} via ${SENDER.name} <${SENDER.address}>`
}

/**
 * RFC 8058 One-Click unsubscribe.
 *
 * Gmail and Yahoo both expect bulk mail to carry this, and a reader who can
 * leave in one tap uses it instead of the report-spam button — which is the
 * signal that actually costs a sending domain its inbox placement. The URL has
 * to unsubscribe on POST alone, with no confirmation step.
 */
function unsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  }
}

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
  /** Per-recipient One-Click unsubscribe endpoint. */
  unsubscribeUrl: string
  /** Creator's address, when the poll opted in to direct replies. */
  replyTo?: string
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
  /** Per-recipient One-Click unsubscribe endpoint. */
  unsubscribeUrl: string
  /** Creator's address, when the poll opted in to direct replies. */
  replyTo?: string
}

export interface WinnerEmailProps {
  participantName: string
  participantEmail: string
  creatorName: string
  pollTitle: string
  winnerLabel: string
  resultsUrl: string
  icsUrl?: string
  /** Per-recipient One-Click unsubscribe endpoint. */
  unsubscribeUrl: string
  /** Creator's address, when the poll opted in to direct replies. */
  replyTo?: string
}

interface Message {
  to: string
  subject: string
  html: string
  text: string
  from: string
  replyTo?: string
  headers: Record<string, string>
}

/** Who the provider actually accepted, and why it turned the rest away. */
export interface DeliveryResult {
  sent: string[]
  failed: Array<{ email: string; reason: string }>
  /** Addresses skipped because they unsubscribed. Never a failure to retry. */
  suppressed: string[]
}

const EMPTY_RESULT: DeliveryResult = { sent: [], failed: [], suppressed: [] }

/** The subset of these addresses that has unsubscribed. */
export async function suppressedAmong(emails: string[]): Promise<Set<string>> {
  const lowered = [...new Set(emails.map((e) => e.trim().toLowerCase()))]
  if (lowered.length === 0) return new Set()
  const rows = await db.emailSuppression.findMany({
    where: { email: { in: lowered } },
    select: { email: true },
  })
  return new Set(rows.map((r) => r.email))
}

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
  envelope: { to: string; subject: string; senderName?: string; replyTo?: string; unsubscribeUrl: string },
  element: React.ReactElement,
): Promise<Message> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])
  return {
    to: envelope.to,
    subject: envelope.subject,
    html,
    text,
    from: senderFor(envelope.senderName),
    replyTo: envelope.replyTo,
    headers: unsubscribeHeaders(envelope.unsubscribeUrl),
  }
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
          from: m.from,
          to: m.to,
          subject: m.subject,
          html: m.html,
          text: m.text,
          headers: m.headers,
          ...(m.replyTo ? { replyTo: m.replyTo } : {}),
        })),
        BATCH_OPTIONS,
      )
    } catch (err) {
      // The request never completed, so nothing in the chunk was sent.
      if (attempt < MAX_ATTEMPTS) continue
      return { sent, failed: chunk.map((m) => ({ email: m.to, reason: reasonOf(err) })), suppressed: [] }
    }

    const error = response.error
    if (error) {
      // The call as a whole was rejected — again, nothing was sent.
      if (RETRYABLE.has(error.name) && attempt < MAX_ATTEMPTS) continue
      return { sent, failed: chunk.map((m) => ({ email: m.to, reason: error.message })), suppressed: [] }
    }

    // Permissive validation reports the messages it refused by their index in
    // the payload; every other index was accepted.
    const rejected = new Map(response.data.errors?.map((e) => [e.index, e.message]))
    for (const [i, m] of chunk.entries()) {
      const reason = rejected.get(i)
      if (reason === undefined) sent.push(m.to)
      else failed.push({ email: m.to, reason })
    }
    return { sent, failed, suppressed: [] }
  }

  return { sent, failed, suppressed: [] }
}

/** Send every message, in provider-sized chunks, and report the outcome. */
async function sendBulk(messages: Message[]): Promise<DeliveryResult> {
  if (messages.length === 0) return EMPTY_RESULT

  // Enforced here rather than at each call site: a send path that forgets to
  // check is a message to someone who told us to stop, and one complaint costs
  // far more than it delivers. Every route reaches the provider through here.
  const optedOut = await suppressedAmong(messages.map((m) => m.to))
  const suppressed: string[] = []
  const deliverable: Message[] = []
  for (const m of messages) {
    if (optedOut.has(m.to.trim().toLowerCase())) suppressed.push(m.to)
    else deliverable.push(m)
  }

  const sent: string[] = []
  const failed: DeliveryResult["failed"] = []

  for (let i = 0; i < deliverable.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(CHUNK_GAP_MS)
    const outcome = await sendChunk(deliverable.slice(i, i + BATCH_SIZE))
    sent.push(...outcome.sent)
    failed.push(...outcome.failed)
  }

  return { sent, failed, suppressed }
}

export async function sendInviteEmails(props: InviteEmailProps[]): Promise<DeliveryResult> {
  const messages = await Promise.all(
    props.map((p) =>
      renderMessage(
        {
          to: p.participantEmail,
          subject: `${p.pollTitle} — ${p.creatorName} wants your vote`,
          senderName: p.creatorName,
          replyTo: p.replyTo,
          unsubscribeUrl: p.unsubscribeUrl,
        },
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
    props.map((p) =>
      renderMessage(
        {
          to: p.participantEmail,
          subject: subject(p),
          senderName: p.creatorName,
          replyTo: p.replyTo,
          unsubscribeUrl: p.unsubscribeUrl,
        },
        templates[level](p),
      ),
    ),
  )
  return sendBulk(messages)
}

export async function sendWinnerEmails(props: WinnerEmailProps[]): Promise<DeliveryResult> {
  const messages = await Promise.all(
    props.map((p) =>
      renderMessage(
        {
          to: p.participantEmail,
          subject: `It's decided! ${p.pollTitle} → ${p.winnerLabel}`,
          senderName: p.creatorName,
          replyTo: p.replyTo,
          unsubscribeUrl: p.unsubscribeUrl,
        },
        WinnerEmail(p),
      ),
    ),
  )
  return sendBulk(messages)
}
