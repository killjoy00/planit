import { NextRequest, NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"
import { GET as runReminders } from "../reminders/route"
import { GET as runAutoClose } from "../auto-close/route"
import { pruneEmailSendAttempts } from "@/lib/signin-rate-limit"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Sequential, and auto-close first, deliberately.
  //
  // Run in parallel, both handlers select `status: OPEN` before either writes
  // `CLOSED`, so a poll whose deadline has just passed lands in both sets: the
  // guest list gets "you still haven't voted" and "it's decided" from the same
  // nightly run, in whichever order the provider delivers them. Closing first
  // takes those polls out of the reminder query.
  const autoCloseRes = await runAutoClose(req)
  const remindersRes = await runReminders(req)

  // Rate-limit bookkeeping only, and every window it feeds is under a day, so
  // anything older is dead weight. Pruned here rather than on the sign-in path,
  // which should stay a couple of indexed reads.
  const prunedEmailSendAttempts = await pruneEmailSendAttempts()

  return NextResponse.json({
    autoClose: await autoCloseRes.json(),
    reminders: await remindersRes.json(),
    prunedEmailSendAttempts,
  })
}
