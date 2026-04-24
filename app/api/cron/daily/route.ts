import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { GET as runReminders } from "../reminders/route"
import { GET as runAutoClose } from "../auto-close/route"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [autoCloseRes, remindersRes] = await Promise.all([
    runAutoClose(req),
    runReminders(req),
  ])

  return NextResponse.json({
    autoClose: await autoCloseRes.json(),
    reminders: await remindersRes.json(),
  })
}
