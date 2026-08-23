import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendReminderEmail } from "@/lib/email"
import { creatorDisplayName } from "@/lib/display-name"

const HOURS = 60 * 60 * 1000

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const openPolls = await db.poll.findMany({
    where: { status: "OPEN", reminderLevel: { lt: 3 } },
    include: {
      creator: { select: { name: true, email: true } },
      participants: { include: { vote: true } },
    },
  })

  const results: { pollId: string; level: number; sent: number }[] = []

  for (const poll of openPolls) {
    const ageMs = now.getTime() - poll.createdAt.getTime()
    const thresholds = [24 * HOURS, 72 * HOURS, 120 * HOURS]
    const nextLevel = poll.reminderLevel + 1 as 1 | 2 | 3
    if (nextLevel > 3) continue
    if (ageMs < thresholds[nextLevel - 1]) continue

    const unvoted = poll.participants.filter((p) => !p.votedAt && !p.optedOut)
    if (unvoted.length === 0) continue

    const voted = poll.participants.filter((p) => p.votedAt && !p.optedOut).length
    const total = poll.participants.filter((p) => !p.optedOut).length
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const creatorName = creatorDisplayName(poll.creator)
    const pendingNames = unvoted.map((p) => p.name)

    let sent = 0
    for (const p of unvoted) {
      try {
        await sendReminderEmail(nextLevel, {
          participantName: p.name,
          participantEmail: p.email,
          creatorName,
          pollTitle: poll.title,
          voteUrl: `${appUrl}/vote/${p.token}`,
          optOutUrl: `${appUrl}/vote/${p.token}/opted-out`,
          votedCount: voted,
          totalCount: total,
          pendingNames,
        })
        sent++
      } catch { /* continue sending to others */ }
    }

    await db.poll.update({
      where: { id: poll.id },
      data: { reminderLevel: nextLevel, lastReminderAt: now },
    })

    results.push({ pollId: poll.id, level: nextLevel, sent })
  }

  return NextResponse.json({ processed: results.length, results })
}
