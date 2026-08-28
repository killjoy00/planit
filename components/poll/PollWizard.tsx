"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { COMMON_TIME_ZONES, localDateTimeToUtc } from "@/lib/time-zones"

interface GroupMember { id: string; name: string; email: string }
interface Group { id: string; name: string; members: GroupMember[] }

interface Props {
  groups: Group[]
  /** Current display name, or a guess from the email when none is saved yet. */
  defaultCreatorName: string
  /** False when the guess is standing in for a name the user never set. */
  hasSavedName: boolean
  template?: PollTemplate
}

type PollType = "DATE_POLL" | "TIME_POLL" | "SINGLE_CHOICE" | "YES_NO_VETO"
interface Option { label: string; dateValue: string; endDate: string }
interface Invitee { name: string; email: string }

interface PollTemplate {
  sourceTitle: string
  title: string
  description: string
  type: PollType
  timeZone: string
  options: Option[]
  invitees: Invitee[]
  threshold: string
  allowSuggestions: boolean
  replyToCreator: boolean
}

export function PollWizard({ groups, defaultCreatorName, hasSavedName, template }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")

  // Step 1 — type
  const [pollType, setPollType] = useState<PollType>(template?.type ?? "DATE_POLL")

  // Step 2 — title, description, options
  const [title, setTitle] = useState(template?.title ?? "")
  const [description, setDescription] = useState(template?.description ?? "")
  const [options, setOptions] = useState<Option[]>(template?.options.length ? template.options : [
    { label: "", dateValue: "", endDate: "" },
    { label: "", dateValue: "", endDate: "" },
  ])

  // Step 3 — sender name, group/invitees, deadline, threshold, suggestions
  const [creatorName, setCreatorName] = useState(defaultCreatorName)
  const [groupId, setGroupId] = useState("")
  const [extraInvitees, setExtraInvitees] = useState<Invitee[]>(template?.invitees ?? [])
  const [deadline, setDeadline] = useState("")
  const [threshold, setThreshold] = useState(template?.threshold ?? "")
  const [allowSuggestions, setAllowSuggestions] = useState(template?.allowSuggestions ?? false)
  const [replyToCreator, setReplyToCreator] = useState(template?.replyToCreator ?? false)
  const [timeZone, setTimeZone] = useState(template?.timeZone ?? "")
  // Counting back from the deadline only means anything when there is one, so
  // this follows the deadline field rather than sitting as a separate choice
  // the creator has to remember to revisit.
  const [remindBeforeDeadline, setRemindBeforeDeadline] = useState(true)

  useEffect(() => {
    if (timeZone) return
    const timeout = window.setTimeout(() => {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [timeZone])

  const selectedGroup = groups.find((g) => g.id === groupId)
  const groupMembers: Invitee[] = selectedGroup?.members ?? []
  const allInvitees: Invitee[] = [
    ...groupMembers,
    ...extraInvitees.filter((e) => e.name && e.email),
  ]

  function addOption() { setOptions((o) => [...o, { label: "", dateValue: "", endDate: "" }]) }
  function removeOption(i: number) { setOptions((o) => o.filter((_, idx) => idx !== i)) }
  function updateOption(i: number, field: keyof Option, val: string) {
    setOptions((o) => o.map((opt, idx) => {
      if (idx !== i) return opt
      if (field === "dateValue" && val) {
        // Anchor the end-date field to the start date so its calendar picker
        // opens there instead of on today, and keep it valid if the start
        // date moves past a previously chosen end date.
        const endDate = !opt.endDate || opt.endDate < val ? val : opt.endDate
        return { ...opt, dateValue: val, endDate }
      }
      return { ...opt, [field]: val }
    }))
  }

  function addExtra() { setExtraInvitees((e) => [...e, { name: "", email: "" }]) }
  function updateExtra(i: number, field: keyof Invitee, val: string) {
    setExtraInvitees((e) => e.map((inv, idx) => idx === i ? { ...inv, [field]: val } : inv))
  }
  function removeExtra(i: number) { setExtraInvitees((e) => e.filter((_, idx) => idx !== i)) }

  function nextStep() {
    setError("")
    if (step === 2) {
      if (!title.trim()) return setError("Poll title is required.")
      if (pollType === "TIME_POLL" && !timeZone.trim()) return setError("Choose a time zone.")
      if (pollType !== "YES_NO_VETO") {
        const valid = options.filter((o) => o.label.trim())
        if (valid.length < 2) return setError("Add at least 2 options.")
        if ((pollType === "DATE_POLL" || pollType === "TIME_POLL") && valid.some((o) => !o.dateValue)) {
          return setError(pollType === "TIME_POLL" ? "Add a start time for every option." : "Add a date for every option.")
        }
        if (pollType === "TIME_POLL" && valid.some((o) => !o.endDate || o.endDate <= o.dateValue)) {
          return setError("Every time option needs an end after its start.")
        }
      }
    }
    if (step === 3 && !creatorName.trim()) return setError("Add the name participants will see.")
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setError("")

    const requestOptions = pollType === "YES_NO_VETO"
      ? [{ label: title.trim() }]
      : options.filter((o) => o.label.trim()).map((o) => {
          if (pollType === "TIME_POLL") {
            const start = localDateTimeToUtc(o.dateValue, timeZone)
            const end = localDateTimeToUtc(o.endDate, timeZone)
            if (!start || !end || end <= start) return null
            return { label: o.label.trim(), dateValue: start.toISOString(), endDate: end.toISOString() }
          }
          return {
            label: o.label.trim(),
            // Date polls represent calendar dates, not instants. Anchor them
            // to UTC so a creator east of Greenwich cannot accidentally save
            // the previous day when their local midnight is serialized.
            dateValue: o.dateValue ? `${o.dateValue.slice(0, 10)}T00:00:00.000Z` : undefined,
            endDate: o.endDate ? `${o.endDate.slice(0, 10)}T00:00:00.000Z` : undefined,
          }
        })

    if (requestOptions.some((option) => option === null)) {
      return setError("One of those local times does not exist in the selected time zone.")
    }
    const safeOptions = requestOptions.filter((option) => option !== null)

    const body = {
      creatorName: creatorName.trim() || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      type: pollType,
      options: safeOptions,
      timeZone: pollType === "TIME_POLL" ? timeZone : undefined,
      groupId: groupId || undefined,
      invitees: allInvitees,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      threshold: threshold ? parseInt(threshold) : undefined,
      allowSuggestions: pollType === "SINGLE_CHOICE" && allowSuggestions,
      replyToCreator,
      reminderSchedule: deadline && remindBeforeDeadline ? "BEFORE_DEADLINE" : "AFTER_SEND",
    }

    startTransition(async () => {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(typeof data.error === "string" ? data.error : "Something went wrong.")
        return
      }
      const { id } = await res.json()
      router.push(`/polls/${id}`)
    })
  }

  const stepLabels = ["Type", "Details", "People", "Create"]

  return (
    <div className="space-y-6">
      {template && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Planning again from <strong>{template.sourceTitle}</strong>. Choose a new deadline before sending.
        </div>
      )}
      {/* Progress */}
      <div className="flex gap-2">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-indigo-500" : "bg-gray-200"}`} />
            <p className={`text-xs mt-1 ${i + 1 === step ? "text-indigo-600 font-medium" : "text-gray-400"}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Poll type */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">What kind of poll?</p>
          {([
            { value: "DATE_POLL", label: "Pick a date", desc: "Choose from multiple date options" },
            { value: "TIME_POLL", label: "Pick a time", desc: "Compare time slots with Ideal / Works / Can't availability" },
            { value: "SINGLE_CHOICE", label: "Single choice", desc: "Pick one option from a list" },
            { value: "YES_NO_VETO", label: "Yes / Fine / Hard No", desc: "Anyone can veto. Good for all-or-nothing decisions." },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => setPollType(t.value)}
              className={`w-full text-left rounded-xl border-2 px-4 py-4 transition-all ${
                pollType === t.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-gray-900">{t.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Title + options */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poll title</label>
            <input
              type="text"
              placeholder={pollType === "DATE_POLL" ? "Weekend trip to the mountains?" : pollType === "TIME_POLL" ? "When should we meet?" : "Where should we eat?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              placeholder="Any context your group needs to know…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 resize-none focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {pollType === "TIME_POLL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time zone</label>
              <input
                type="text"
                list="planit-time-zones"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                placeholder="America/New_York"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <datalist id="planit-time-zones">
                {COMMON_TIME_ZONES.map((zone) => <option key={zone} value={zone} />)}
              </datalist>
              <p className="mt-1 text-xs text-gray-400">Every voter sees these slots in this named zone.</p>
            </div>
          )}
          {pollType !== "YES_NO_VETO" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={pollType === "DATE_POLL" ? "Label (e.g. Beach weekend)" : pollType === "TIME_POLL" ? `Slot ${i + 1} label` : `Option ${i + 1}`}
                        value={opt.label}
                        onChange={(e) => updateOption(i, "label", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-500">✕</button>
                      )}
                    </div>
                    {pollType === "DATE_POLL" && (
                      <div className="flex gap-2 items-center ml-0.5">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-0.5">Start date</label>
                          <input
                            type="date"
                            value={opt.dateValue ? opt.dateValue.slice(0, 10) : ""}
                            onChange={(e) => updateOption(i, "dateValue", e.target.value ? `${e.target.value}T00:00` : "")}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-0.5">End date <span className="text-gray-300">(optional)</span></label>
                          <input
                            type="date"
                            value={opt.endDate ? opt.endDate.slice(0, 10) : ""}
                            min={opt.dateValue ? opt.dateValue.slice(0, 10) : undefined}
                            onChange={(e) => updateOption(i, "endDate", e.target.value ? `${e.target.value}T00:00` : "")}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                    {pollType === "TIME_POLL" && (
                      <div className="ml-0.5 grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">Starts</label>
                          <input
                            type="datetime-local"
                            value={opt.dateValue}
                            onChange={(e) => updateOption(i, "dateValue", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">Ends</label>
                          <input
                            type="datetime-local"
                            value={opt.endDate}
                            min={opt.dateValue || undefined}
                            onChange={(e) => updateOption(i, "endDate", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOption} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add option</button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Invitees */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              placeholder="Ryan"
              value={creatorName}
              maxLength={60}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-1 text-xs text-gray-400">
              {creatorName.trim()
                ? `Invitees see: “${creatorName.trim()} is planning ${title.trim() || "…"}”`
                : "Shown in the invitation and the reminders."}
              {!hasSavedName && " Saved for next time."}
            </p>
          </div>
          {groups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Use a group</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.members.length} members)</option>
                ))}
              </select>
            </div>
          )}
          {selectedGroup && selectedGroup.members.length > 0 && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Inviting: {selectedGroup.members.map((m) => m.name.split(" ")[0]).join(", ")}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email invitees <span className="font-normal text-gray-400">(optional)</span></label>
            <p className="mb-2 text-xs text-gray-500">
              Create without invitees if you would rather share the join link through text or group chat.
            </p>
            <div className="space-y-2">
              {extraInvitees.map((inv, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={inv.name}
                    onChange={(e) => updateExtra(i, "name", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={inv.email}
                    onChange={(e) => updateExtra(i, "email", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => removeExtra(i)} className="self-start px-2 py-2 text-sm text-gray-500 hover:text-red-500 sm:self-auto" aria-label={`Remove invitee ${i + 1}`}>Remove</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addExtra} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add invitee</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-close at <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="number"
                placeholder="e.g. 5 votes"
                value={threshold}
                min={1}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-gray-900">Remind people who haven&apos;t voted</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRemindBeforeDeadline(false)}
                className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                  !deadline || !remindBeforeDeadline
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block text-xs font-medium text-gray-900">After sending</span>
                <span className="block text-xs text-gray-500 mt-0.5">24h, 48h, 96h</span>
              </button>
              <button
                type="button"
                onClick={() => deadline && setRemindBeforeDeadline(true)}
                disabled={!deadline}
                className={`rounded-lg border-2 px-3 py-2 text-left transition-all disabled:opacity-40 ${
                  deadline && remindBeforeDeadline
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block text-xs font-medium text-gray-900">Before the deadline</span>
                <span className="block text-xs text-gray-500 mt-0.5">72h, 48h, 24h</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {!deadline
                ? "Set a deadline above to count reminders back from it."
                : remindBeforeDeadline
                  ? "The last nudge lands a day before you need an answer."
                  : "Timed from when the invitations go out."}
            </p>
          </div>
          {pollType === "SINGLE_CHOICE" && (
            <button
              type="button"
              onClick={() => setAllowSuggestions((v) => !v)}
              className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                allowSuggestions ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Allow participants to suggest options</p>
                <p className="text-xs text-gray-500 mt-0.5">Anyone can add a new option while voting</p>
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                allowSuggestions ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
              }`}>
                {allowSuggestions && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </button>
          )}
          <button
            type="button"
            onClick={() => setReplyToCreator((v) => !v)}
            className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
              replyToCreator ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Let people reply to me directly</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Replies go to your email instead of nowhere. Invitees will see your address — and mail
                people can answer is far less likely to land in spam.
              </p>
            </div>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
              replyToCreator ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
            }`}>
              {replyToCreator && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-medium">{creatorName.trim()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium">{title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{pollType.replace(/_/g, " ")}</span></div>
            {pollType !== "YES_NO_VETO" && (
              <div className="flex justify-between"><span className="text-gray-500">Options</span><span className="font-medium">{options.filter((o) => o.label).length}</span></div>
            )}
            {pollType === "TIME_POLL" && (
              <div className="flex justify-between"><span className="text-gray-500">Time zone</span><span className="font-medium">{timeZone}</span></div>
            )}
            <div className="flex justify-between gap-4"><span className="text-gray-500">Starting by</span><span className="text-right font-medium">{allInvitees.length > 0 ? `Emailing ${allInvitees.length} ${allInvitees.length === 1 ? "person" : "people"}` : "Sharing a join link"}</span></div>
            {deadline && <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className="font-medium">{new Date(deadline).toLocaleDateString()}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Reminders</span><span className="font-medium">{deadline && remindBeforeDeadline ? "72h/48h/24h before deadline" : "24h/48h/96h after sending"}</span></div>
          </div>
          <p className="text-sm text-gray-500">
            {allInvitees.length > 0
              ? `${allInvitees.length} invite email${allInvitees.length === 1 ? "" : "s"} will be sent immediately.`
              : "Your poll will be created first, then you can share its secure public join link."}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={nextStep}
            className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending
              ? "Creating…"
              : allInvitees.length > 0
                ? `Create & send ${allInvitees.length} invite${allInvitees.length === 1 ? "" : "s"} →`
                : "Create poll & share →"}
          </button>
        )}
      </div>
    </div>
  )
}
