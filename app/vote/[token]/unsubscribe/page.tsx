import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { UnsubscribeConfirm } from "@/components/vote/UnsubscribeConfirm"

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    select: { email: true },
  })
  if (!participant) notFound()

  const already = await db.emailSuppression.findUnique({
    where: { email: participant.email.trim().toLowerCase() },
    select: { id: true },
  })

  return (
    <main className="flex-1 bg-gray-50 px-4 py-12">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <UnsubscribeConfirm
          token={token}
          email={participant.email}
          alreadyUnsubscribed={!!already}
        />
      </div>
    </main>
  )
}
