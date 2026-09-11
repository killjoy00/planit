import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * Default post-login landing page. New organizers have one job: make the first
 * poll. Returning organizers already have context worth seeing on /dashboard.
 */
export default async function StartPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const existingPoll = await db.poll.findFirst({
    where: { creatorId: userId },
    select: { id: true },
  })

  redirect(existingPoll ? "/dashboard" : "/polls/new")
}
