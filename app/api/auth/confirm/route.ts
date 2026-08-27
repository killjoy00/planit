import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { buildCallbackUrl, peekVerificationToken } from "@/lib/magic-link"

const schema = z.object({
  token: z.string().min(1),
  email: z.string().min(1),
  callbackUrl: z.string().optional(),
})

/**
 * The one step that turns a sign-in link into a session, behind a POST.
 *
 * `/auth/confirm` already kept a link scanner from spending the token on the
 * *first* touch — it looks the token up without consuming it. But the button on
 * that page used to be a plain anchor pointing at the Auth.js callback, and
 * that callback signs you in on a GET. A scanner that follows links on the page
 * it just fetched — which enterprise mail filters do, detonating links two hops
 * deep — completed the sign-in by itself: an account and a live session, with
 * nobody having clicked anything.
 *
 * So the page now holds no link to the callback at all. Reaching it takes a
 * POST, which link-following does not do, and only then is the callback URL
 * handed back for the browser to follow.
 *
 * This is the convention the rest of the app already keeps: the magic link, the
 * unsubscribe endpoint and the join verification are all POST-only for exactly
 * this reason. This button was the one that got away.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "This sign-in link is incomplete." }, { status: 400 })
  }

  const { token, email, callbackUrl } = parsed.data

  // Checked again here rather than trusting the page that rendered the button:
  // the page's own check happened when it loaded, and a link is good for 24
  // hours, so it may have been spent or expired in between.
  const state = await peekVerificationToken({ token, email })
  if (state !== "valid") {
    return NextResponse.json(
      {
        error:
          state === "expired"
            ? "That sign-in link expired. Ask for a fresh one."
            : "That sign-in link was already used. Ask for a fresh one.",
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ url: buildCallbackUrl({ token, email, callbackUrl }) })
}
