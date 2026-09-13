import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendReminderEmails } from "@/lib/email"
import { creatorDisplayName } from "@/lib/display-name"
import { isFastJoinEmail } from "@/lib/fast-join"
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
    const nextLevel = dueReminderLevel(poll, now)
    if (nextLevel === null) continue

    const active = poll.participants.filter((participant) => !participant.optedOut)
    const allUnvoted = active.filter((participant) => !participant.votedAt)
    const emailableUnvoted = allUnvoted.filter((participant) => !isFastJoinEmail(participant.email))
    if (emailableUnvoted.length === 0) continue

    const voted = active.filter((participant) => participant.votedAt).length
    const total = active.length
    const base = appUrl()
    const creatorName = creatorDisplayName(poll.creator)
    const pendingNames = allUnvoted.map((participant) => participant.name)

    const delivery = await sendReminderEmails(
      nextLevel,
      emailableUnvoted.map((participant) => ({
        participantName: participant.name,
        participantEmail: participant.email,
        creatorName,
        pollTitle: poll.title,
        voteUrl: `${base}/vote/${participant.token}`,
        optOutUrl: `${base}/vote/${participant.token}/opted-out`,
        unsubscribeUrl: `${base}/api/unsubscribe/${participant.token}`,
        replyTo: poll.replyToCreator ? poll.creator.email ?? undefined : undefined,
        votedCount: voted,
        totalCount: total,
        pendingNames,
      })),
    )

    if (delivery.failed.length > 0) {
      console.error(
        `[reminders] poll ${poll.id}: level ${nextLevel} refused for ${delivery.failed.length} of ${emailableUnvoted.length}`,
        delivery.failed,
      )
    }

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
