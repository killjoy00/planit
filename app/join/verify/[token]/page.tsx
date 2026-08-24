import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { VerifyJoinConfirm } from "@/components/join/VerifyJoinConfirm"

export default async function VerifyJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Looked up, never spent: the button below is what commits it.
  const request = await db.joinRequest.findUnique({
    where: { token },
    include: { poll: { select: { title: true, status: true } } },
  })
  if (!request) notFound()

  return (
    <main className="flex-1 bg-gray-50 px-4 py-12">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <VerifyJoinConfirm
          token={token}
          email={request.email}
          pollTitle={request.poll.title}
          expired={request.expires < new Date()}
          closed={request.poll.status !== "OPEN"}
        />
      </div>
    </main>
  )
}
