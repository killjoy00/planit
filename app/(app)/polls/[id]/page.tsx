import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { PollResults } from "@/components/poll/PollResults"

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session!.user!.id!

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      participants: { include: { votes: true }, orderBy: { createdAt: "asc" } },
      winner: true,
      group: { select: { name: true } },
    },
  })

  if (!poll || poll.creatorId !== userId) notFound()

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600">
        ← Back to dashboard
      </Link>
      <div>
        <div className="flex items-center gap-2">
          {poll.group && <span className="text-sm text-gray-500">{poll.group.name} ·</span>}
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
            poll.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>{poll.status}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{poll.title}</h1>
        {poll.description && <p className="mt-1 text-gray-600">{poll.description}</p>}
      </div>

      <PollResults
        pollId={id}
        initialData={{
          status: poll.status,
          winnerId: poll.winnerId,
          winner: poll.winner ? { id: poll.winner.id, label: poll.winner.label, dateValue: poll.winner.dateValue?.toISOString() ?? null, endDate: poll.winner.endDate?.toISOString() ?? null } : null,
          options: poll.options.map((o) => ({
            id: o.id, label: o.label,
            dateValue: o.dateValue?.toISOString() ?? null,
            endDate: o.endDate?.toISOString() ?? null,
            suggestedByName: o.suggestedByName,
            voteCount: 0,
          })),
          participants: poll.participants.map((p) => ({
            id: p.id, name: p.name, email: p.email,
            voted: !!p.votedAt, optedOut: p.optedOut,
            inviteDelivered: !!p.inviteSentAt,
            optionIds: p.votes.map((v) => v.optionId).filter((id): id is string => !!id),
            choice: p.votes.find((v) => v.choice)?.choice ?? null,
          })),
        }}
        pollType={poll.type}
        pollTitle={poll.title}
        icsAvailable={!!poll.winner?.dateValue}
        pollIdForIcs={id}
      />
    </div>
  )
}
