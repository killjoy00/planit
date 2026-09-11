"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { COMMON_TIME_ZONES, localDateTimeToUtc } from "@/lib/time-zones"

interface GroupMember { id: string; name: string; email: string }
interface Group { id: string; name: string; members: GroupMember[] }

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

interface Props {
  groups: Group[]
  /** Current display name, or a guess from the email when none is saved yet. */
  defaultCreatorName: string
  /** False when the guess is standing in for a name the user never set. */
  hasSavedName: boolean
  template?: PollTemplate
  /** First-ever poll: optimize for getting a useful poll sent, not configuration. */
  firstRun?: boolean
}

const QUICK_STARTS: { value: PollType; label: string; desc: string }[] = [
  { value: "DATE_POLL", label: "Find a date", desc: "See which dates work for everyone" },
  { value: "TIME_POLL", label: "Find a time", desc: "Compare time slots as Ideal / Works / Can't" },
  { value: "SINGLE_CHOICE", label: "Choose between options", desc: "Restaurant, destination, activity, or anything else" },
  { value: "YES_NO_VETO", label: "Get a yes / no", desc: "Make one proposal and let anyone flag a hard no" },
]

export function PollWizard({ groups, defaultCreatorName, hasSavedName, template, firstRun = false }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")

  const [pollType, setPollType] = useState<PollType>(template?.type ?? "DATE_POLL")
  const [title, setTitle] = useState(template?.title ?? "")
  const [description, setDescription] = useState(template?.description ?? "")
  const [options, setOptions] = useState<Option[]>(template?.options.length ? template.options : [
    { label: "", dateValue: "", endDate: "" },
    { label: "", dateValue: "", endDate: "" },
  ])

  const [creatorName, setCreatorName] = useState(defaultCreatorName)
  const [groupId, setGroupId] = useState("")
  const [extraInvitees, setExtraInvitees] = useState<Invitee[]>(
    template?.invitees ?? (firstRun ? [{ name: "", email: "" }] : []),
  )
  const [deadline, setDeadline] = useState("")
  const [threshold, setThreshold] = useState(template?.threshold ?? "")
  const [allowSuggestions, setAllowSuggestions] = useState(template?.allowSuggestions ?? false)
  const [replyToCreator, setReplyToCreator] = useState(template?.replyToCreator ?? false)
  const [timeZone, setTimeZone] = useState(template?.timeZone ?? "")
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
    ...extraInvitees.filter((e) => e.name.trim() && e.email.trim()),
  ]

  function chooseType(value: PollType) {
    setPollType(value)
    setError("")
    if (firstRun) setStep(2)
  }

  function addOption() { setOptions((current) => [...current, { label: "", dateValue: "", endDate: "" }]) }
  function removeOption(i: number) { setOptions((current) => current.filter((_, idx) => idx !== i)) }
  function updateOption(i: number, field: keyof Option, value: string) {
    setOptions((current) => current.map((option, idx) => {
      if (idx !== i) return option
      if (field === "dateValue" && value) {
        const endDate = !option.endDate || option.endDate < value ? value : option.endDate
        return { ...option, dateValue: value, endDate }
      }
      return { ...option, [field]: value }
    }))
  }

  function addExtra() { setExtraInvitees((current) => [...current, { name: "", email: "" }]) }
  function updateExtra(i: number, field: keyof Invitee, value: string) {
    setExtraInvitees((current) => current.map((invitee, idx) => idx === i ? { ...invitee, [field]: value } : invitee))
  }
  function removeExtra(i: number) { setExtraInvitees((current) => current.filter((_, idx) => idx !== i)) }

  function optionIsUsable(option: Option): boolean {
    if (pollType === "DATE_POLL" || pollType === "TIME_POLL") return !!option.dateValue
    return !!option.label.trim()
  }

  function validateQuestion(): string | null {
    if (!title.trim()) return "Poll title is required."
    if (pollType === "TIME_POLL" && !timeZone.trim()) return "Choose a time zone."
    if (pollType === "YES_NO_VETO") return null

    const valid = options.filter(optionIsUsable)
    if (valid.length < 2) return "Add at least 2 options."
    if ((pollType === "DATE_POLL" || pollType === "TIME_POLL") && valid.some((option) => !option.dateValue)) {
      return pollType === "TIME_POLL" ? "Add a start time for every option." : "Add a date for every option."
    }
    if (pollType === "TIME_POLL" && valid.some((option) => !option.endDate || option.endDate <= option.dateValue)) {
      return "Every time option needs an end after its start."
    }
    return null
  }

  function nextStep() {
    setError("")
    if (step === 2) {
      const questionError = validateQuestion()
      if (questionError) return setError(questionError)
    }
    if (step === 3 && !creatorName.trim()) return setError("Add the name participants will see.")
    setStep((current) => current + 1)
  }

  async function handleSubmit() {
    setError("")
    const questionError = validateQuestion()
    if (questionError) return setError(questionError)
    if (!creatorName.trim()) return setError("Add the name participants will see.")

    const requestOptions = pollType === "YES_NO_VETO"
      ? [{ label: title.trim() }]
      : options.filter(optionIsUsable).map((option, index) => {
          const fallbackLabel = pollType === "DATE_POLL" ? `Date ${index + 1}` : pollType === "TIME_POLL" ? `Time ${index + 1}` : `Option ${index + 1}`
          if (pollType === "TIME_POLL") {
            const start = localDateTimeToUtc(option.dateValue, timeZone)
            const end = localDateTimeToUtc(option.endDate, timeZone)
            if (!start || !end || end <= start) return null
            return {
              label: option.label.trim() || fallbackLabel,
              dateValue: start.toISOString(),
              endDate: end.toISOString(),
            }
          }
          return {
            label: option.label.trim() || fallbackLabel,
            dateValue: option.dateValue ? `${option.dateValue.slice(0, 10)}T00:00:00.000Z` : undefined,
            endDate: option.endDate ? `${option.endDate.slice(0, 10)}T00:00:00.000Z` : undefined,
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

  const stepLabels = firstRun ? ["Start", "Question", "Send"] : ["Type", "Details", "People", "Create"]

  const advancedSettings = (
    <div className="space-y-4">
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
              !deadline || !remindBeforeDeadline ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
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
              deadline && remindBeforeDeadline ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
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
          onClick={() => setAllowSuggestions((value) => !value)}
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
        onClick={() => setReplyToCreator((value) => !value)}
        className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
          replyToCreator ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">Let people reply to me directly</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Replies go to your email instead of nowhere. Invitees will see your address — and mail people can answer is far less likely to land in spam.
          </p>
        </div>
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
          replyToCreator ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
        }`}>
          {replyToCreator && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      </button>
    </div>
  )

  const submitLabel = isPending
    ? "Creating…"
    : allInvitees.length > 0
      ? `Create & send ${allInvitees.length} invite${allInvitees.length === 1 ? "" : "s"} →`
      : "Create poll & share →"

  return (
    <div className="space-y-6">
      {template && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Planning again from <strong>{template.sourceTitle}</strong>. Choose a new deadline before sending.
        </div>
      )}

      <div className="flex gap-2">
        {stepLabels.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${index + 1 <= step ? "bg-indigo-500" : "bg-gray-200"}`} />
            <p className={`text-xs mt-1 ${index + 1 === step ? "text-indigo-600 font-medium" : "text-gray-400"}`}>{label}</p>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">{firstRun ? "What are you trying to decide?" : "What kind of poll?"}</p>
            {firstRun && <p className="mt-1 text-xs text-gray-500">Choose one and we&apos;ll get straight to the question.</p>}
          </div>
          {QUICK_STARTS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => chooseType(item.value)}
              className={`w-full text-left rounded-xl border-2 px-4 py-4 transition-all ${
                pollType === item.value && !firstRun ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
              }`}
            >
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are you deciding?</label>
            <input
              type="text"
              placeholder={pollType === "DATE_POLL" ? "When should we get together?" : pollType === "TIME_POLL" ? "When should we meet?" : pollType === "YES_NO_VETO" ? "Should we book the cabin?" : "Where should we eat?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              placeholder="Anything people need to know before voting…"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Choices</label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={pollType === "DATE_POLL" || pollType === "TIME_POLL" ? "Label (optional)" : `Option ${index + 1}`}
                        value={option.label}
                        onChange={(e) => updateOption(index, "label", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(index)} className="text-gray-400 hover:text-red-500" aria-label={`Remove option ${index + 1}`}>✕</button>
                      )}
                    </div>
                    {pollType === "DATE_POLL" && (
                      <div className="flex gap-2 items-center ml-0.5">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-0.5">Date</label>
                          <input
                            type="date"
                            value={option.dateValue ? option.dateValue.slice(0, 10) : ""}
                            onChange={(e) => updateOption(index, "dateValue", e.target.value ? `${e.target.value}T00:00` : "")}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-0.5">Through <span className="text-gray-300">(optional)</span></label>
                          <input
                            type="date"
                            value={option.endDate ? option.endDate.slice(0, 10) : ""}
                            min={option.dateValue ? option.dateValue.slice(0, 10) : undefined}
                            onChange={(e) => updateOption(index, "endDate", e.target.value ? `${e.target.value}T00:00` : "")}
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
                            value={option.dateValue}
                            onChange={(e) => updateOption(index, "dateValue", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">Ends</label>
                          <input
                            type="datetime-local"
                            value={option.endDate}
                            min={option.dateValue || undefined}
                            onChange={(e) => updateOption(index, "endDate", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOption} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add option</button>
              {(pollType === "DATE_POLL" || pollType === "TIME_POLL") && (
                <p className="mt-2 text-xs text-gray-400">Labels are optional — the date or time is enough.</p>
              )}
            </div>
          )}
        </div>
      )}

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
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name} ({group.members.length} members)</option>
                ))}
              </select>
            </div>
          )}
          {selectedGroup && selectedGroup.members.length > 0 && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Inviting: {selectedGroup.members.map((member) => member.name.split(" ")[0]).join(", ")}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Who should vote? <span className="font-normal text-gray-400">(optional)</span></label>
            <p className="mb-2 text-xs text-gray-500">
              Add email invitees now, or leave this blank and share the join link yourself after creating the poll.
            </p>
            <div className="space-y-2">
              {extraInvitees.map((invitee, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={invitee.name}
                    onChange={(e) => updateExtra(index, "name", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={invitee.email}
                    onChange={(e) => updateExtra(index, "email", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => removeExtra(index)} className="self-start px-2 py-2 text-sm text-gray-500 hover:text-red-500 sm:self-auto" aria-label={`Remove invitee ${index + 1}`}>Remove</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addExtra} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add invitee</button>
          </div>

          {firstRun ? (
            <details className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Optional settings</summary>
              <p className="mt-1 text-xs text-gray-500">Deadline, auto-close, reminder timing, suggestions, and reply-to.</p>
              <div className="mt-4">{advancedSettings}</div>
            </details>
          ) : advancedSettings}
        </div>
      )}

      {!firstRun && step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-medium">{creatorName.trim()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium">{title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{pollType.replace(/_/g, " ")}</span></div>
            {pollType !== "YES_NO_VETO" && (
              <div className="flex justify-between"><span className="text-gray-500">Options</span><span className="font-medium">{options.filter(optionIsUsable).length}</span></div>
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

      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
        )}
        {firstRun && step === 3 ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        ) : step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  )
}
