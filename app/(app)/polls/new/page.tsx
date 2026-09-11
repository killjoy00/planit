import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PollWizard } from "@/components/poll/PollWizard"
import { creatorDisplayName } from "@/lib/display-name"
import { utcToLocalInput } from "@/lib/time-zones"

export default async function NewPollPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!
  const { duplicate } = await searchParams

  const [groups, user, source, pollCount] = await Promise.all([
    db.group.findMany({
      where: { creatorId: userId },
      include: { members: true },
      orderBy: { name: "asc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    duplicate
      ? db.poll.findFirst({
          where: { id: duplicate, creatorId: userId },
          include: {
            options: { orderBy: { order: "asc" } },
            participants: { where: { optedOut: false }, orderBy: { createdAt: "asc" } },
          },
        })
      : null,
    db.poll.count({ where: { creatorId: userId } }),
  ])

  const template = source
    ? {
        sourceTitle: source.title,
        title: source.title,
        description: source.description ?? "",
        type: source.type,
        timeZone: source.timeZone ?? "",
        options: source.options.map((option) => ({
          label: option.label,
          dateValue: option.dateValue
            ? source.type === "TIME_POLL" && source.timeZone
              ? utcToLocalInput(option.dateValue, source.timeZone)
              : `${option.dateValue.toISOString().slice(0, 10)}T00:00`
            : "",
          endDate: option.endDate
            ? source.type === "TIME_POLL" && source.timeZone
              ? utcToLocalInput(option.endDate, source.timeZone)
              : `${option.endDate.toISOString().slice(0, 10)}T00:00`
            : "",
        })),
        invitees: source.participants.map((participant) => ({
          name: participant.name,
          email: participant.email,
        })),
        threshold: source.threshold ? String(source.threshold) : "",
        allowSuggestions: source.allowSuggestions,
        replyToCreator: source.replyToCreator,
      }
    : undefined

  const firstRun = !template && pollCount === 0

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">
        {firstRun ? "Make your first poll" : "New poll"}
      </h1>
      {firstRun && (
        <p className="mt-2 mb-6 text-sm text-gray-500">
          Pick what you need to decide, add the choices, and send it. The extra settings can wait.
        </p>
      )}
      {!firstRun && <div className="mb-6" />}
      <PollWizard
        defaultCreatorName={creatorDisplayName(user)}
        hasSavedName={!!user?.name?.trim()}
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          members: g.members.map((m) => ({ id: m.id, name: m.name, email: m.email })),
        }))}
        template={template}
        firstRun={firstRun}
      />
    </div>
  )
}
