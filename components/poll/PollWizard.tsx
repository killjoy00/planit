"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface GroupMember { id: string; name: string; email: string }
interface Group { id: string; name: string; members: GroupMember[] }

interface Props {
  groups: Group[]
  /** Current display name, or a guess from the email when none is saved yet. */
  defaultCreatorName: string
  /** False when the guess is standing in for a name the user never set. */
  hasSavedName: boolean
}

type PollType = "DATE_POLL" | "SINGLE_CHOICE" | "YES_NO_VETO"
interface Option { label: string; dateValue: string; endDate: string }
interface Invitee { name: string; email: string }

export function PollWizard({ groups, defaultCreatorName, hasSavedName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")

  // Step 1 — type
  const [pollType, setPollType] = useState<PollType>("DATE_POLL")

  // Step 2 — title, description, options
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<Option[]>([
    { label: "", dateValue: "", endDate: "" },
    { label: "", dateValue: "", endDate: "" },
  ])

  // Step 3 — sender name, group/invitees, deadline, threshold, suggestions
  const [creatorName, setCreatorName] = useState(defaultCreatorName)
  const [groupId, setGroupId] = useState("")
  const [extraInvitees, setExtraInvitees] = useState<Invitee[]>([])
  const [deadline, setDeadline] = useState("")
  const [threshold, setThreshold] = useState("")
  const [allowSuggestions, setAllowSuggestions] = useState(false)

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
      if (pollType !== "YES_NO_VETO") {
        const valid = options.filter((o) => o.label.trim())
        if (valid.length < 2) return setError("Add at least 2 options.")
      }
    }
    if (step === 3) {
      if (!creatorName.trim()) return setError("Add the name your invitees will see.")
      if (allInvitees.length === 0) return setError("Add at least one invitee.")
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setError("")
    if (allInvitees.length === 0) return setError("Add at least one invitee.")

    const body = {
      creatorName: creatorName.trim() || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      type: pollType,
      options: pollType === "YES_NO_VETO"
        ? [{ label: title.trim() }]
        : options.filter((o) => o.label.trim()).map((o) => ({
            label: o.label.trim(),
            dateValue: o.dateValue ? new Date(o.dateValue).toISOString() : undefined,
            endDate: o.endDate ? new Date(o.endDate).toISOString() : undefined,
          })),
      groupId: groupId || undefined,
      invitees: allInvitees,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      threshold: threshold ? parseInt(threshold) : undefined,
      allowSuggestions,
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

  const stepLabels = ["Type", "Details", "Invitees", "Send"]

  return (
    <div className="space-y-6">
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
              placeholder={pollType === "DATE_POLL" ? "Weekend trip to the mountains?" : "Where should we eat?"}
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
          {pollType !== "YES_NO_VETO" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={pollType === "DATE_POLL" ? "Label (e.g. Beach weekend)" : `Option ${i + 1}`}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional invitees</label>
            <div className="space-y-2">
              {extraInvitees.map((inv, i) => (
                <div key={i} className="flex gap-2">
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
                  <button type="button" onClick={() => removeExtra(i)} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addExtra} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add invitee</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex justify-between"><span className="text-gray-500">Invitees</span><span className="font-medium">{allInvitees.length} people</span></div>
            {deadline && <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className="font-medium">{new Date(deadline).toLocaleDateString()}</span></div>}
          </div>
          <p className="text-sm text-gray-500">
            {allInvitees.length} invite email{allInvitees.length !== 1 ? "s" : ""} will be sent immediately.
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
            {isPending ? "Sending…" : `Send ${allInvitees.length} invite${allInvitees.length !== 1 ? "s" : ""} →`}
          </button>
        )}
      </div>
    </div>
  )
}
