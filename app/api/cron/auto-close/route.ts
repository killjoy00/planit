import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { CLOSABLE_POLL_INCLUDE, closePollAndAnnounce } from "@/lib/close-poll"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const expired = await db.poll.findMany({
    where: { status: "OPEN", deadline: { lte: now } },
    include: CLOSABLE_POLL_INCLUDE,
  })

  let closed = 0
  for (const poll of expired) {
    const outcome = await closePollAndAnnounce(poll, "auto-close")
    if (outcome.closed) closed++
  }

  return NextResponse.json({ closed })
}
