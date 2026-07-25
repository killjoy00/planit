import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { OptOutConfirm } from "@/components/vote/OptOutConfirm"

export default async function OptedOutPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({
    where: { token },
    include: { poll: { select: { title: true } } },
  })

  if (!participant) notFound()

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        {participant.optedOut ? (
          <>
            <div className="text-4xl">👋</div>
            <h1 className="text-xl font-bold text-gray-900">You&apos;re out</h1>
            <p className="text-gray-500">
              You&apos;ve been removed from <strong>{participant.poll.title}</strong>. The group will move forward without you.
            </p>
          </>
        ) : (
          <OptOutConfirm token={token} pollTitle={participant.poll.title} />
        )}
      </div>
    </main>
  )
}
