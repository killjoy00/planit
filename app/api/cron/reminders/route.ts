import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendReminderEmails } from "@/lib/email"
import { creatorDisplayName } from "@/lib/display-name"
import { appUrl } from "@/lib/site"
import { dueReminderLevel } from "@/lib/reminder-schedule"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const openPolls = await db.poll.findMany({
    where: { status: "OPEN", reminderLevel: { lt: 3 } },
    include: {
      creator: { select: { name: true, email: true } },
      participants: true,
    },
  })

  const results: { pollId: string; level: number; sent: number; failed: number }[] = []

  for (const poll of openPolls) {
    // Which nudge is due depends on the poll's schedule: counted up from the
    // send, or back from the deadline. `dueReminderLevel` also decides what
    // happens to steps a late-created poll is already past.
    const nextLevel = dueReminderLevel(poll, now)
    if (nextLevel === null) continue

    const unvoted = poll.participants.filter((p) => !p.votedAt && !p.optedOut)
    if (unvoted.length === 0) continue

    const voted = poll.participants.filter((p) => p.votedAt && !p.optedOut).length
    const total = poll.participants.filter((p) => !p.optedOut).length
    const base = appUrl()
    const creatorName = creatorDisplayName(poll.creator)
    const pendingNames = unvoted.map((p) => p.name)

    const delivery = await sendReminderEmails(
      nextLevel,
      unvoted.map((p) => ({
        participantName: p.name,
        participantEmail: p.email,
        creatorName,
        pollTitle: poll.title,
        voteUrl: `${base}/vote/${p.token}`,
        optOutUrl: `${base}/vote/${p.token}/opted-out`,
        unsubscribeUrl: `${base}/api/unsubscribe/${p.token}`,
        replyTo: poll.replyToCreator ? poll.creator.email ?? undefined : undefined,
        votedCount: voted,
        totalCount: total,
        pendingNames,
      })),
    )

    if (delivery.failed.length > 0) {
      console.error(
        `[reminders] poll ${poll.id}: level ${nextLevel} refused for ${delivery.failed.length} of ${unvoted.length}`,
        delivery.failed,
      )
    }

    // Advance the level only once something actually went out. Bumping it on a
    // send the provider refused outright would burn the reminder — nobody was
    // reminded, and this level never comes round again.
    if (delivery.sent.length > 0) {
      await db.poll.update({
        where: { id: poll.id },
        data: { reminderLevel: nextLevel, lastReminderAt: now },
      })
    }

    results.push({
      pollId: poll.id,
      level: nextLevel,
      sent: delivery.sent.length,
      failed: delivery.failed.length,
    })
  }

  return NextResponse.json({ processed: results.length, results })
}
