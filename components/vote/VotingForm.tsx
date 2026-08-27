"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDateRange, formatTimeSlot } from "@/lib/time-zones"

interface Option {
  id: string
  label: string
  dateValue: string | null
  endDate: string | null
}

interface Props {
  token: string
  pollType: string
  options: Option[]
  participantName: string
  optOutUrl: string
  allowSuggestions: boolean
  /** Date polls: every option that works for this person, not just one. */
  multiSelect: boolean
  /** They have answered before, so this is an edit and says so. */
  hasVoted: boolean
  initialSelectedIds: string[]
  initialChoice: string | null
  initialPreferences: Array<{ optionId: string; preference: "IDEAL" | "AVAILABLE" }>
  timeZone: string | null
}

export function VotingForm({
  token,
  pollType,
  options: initialOptions,
  participantName,
  optOutUrl,
  allowSuggestions,
  multiSelect,
  hasVoted,
  initialSelectedIds,
  initialChoice,
  initialPreferences,
  timeZone,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [options, setOptions] = useState(initialOptions)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [choice, setChoice] = useState<string>(initialChoice ?? "")
  const [preferences, setPreferences] = useState<Record<string, "IDEAL" | "AVAILABLE">>(
    Object.fromEntries(initialPreferences.map((item) => [item.optionId, item.preference])),
  )
  const [error, setError] = useState("")
  const [suggestion, setSuggestion] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState("")

  const firstName = participantName.split(" ")[0]

  function toggleOption(id: string) {
    setError("")
    setSelectedIds((prev) =>
      multiSelect
        ? prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        : [id],
    )
  }

  async function handleVote() {
    const body =
      pollType === "YES_NO_VETO"
        ? { choice }
        : pollType === "TIME_POLL"
          ? { preferences: Object.entries(preferences).map(([optionId, preference]) => ({ optionId, preference })) }
          : { optionIds: selectedIds }

    if (
      pollType === "YES_NO_VETO"
        ? !choice
        : pollType === "TIME_POLL"
          ? Object.keys(preferences).length === 0
          : selectedIds.length === 0
    ) {
      return setError(
        pollType === "TIME_POLL"
          ? "Mark at least one time as ideal or workable."
          : multiSelect
            ? "Pick at least one date that works."
            : "Please make a selection.",
      )
    }
    setError("")

    startTransition(async () => {
      const res = await fetch(`/api/vote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(typeof data.error === "string" ? data.error : "Something went wrong.")
        return
      }
      router.push(`/vote/${token}/done`)
    })
  }

  async function handleSuggest() {
    if (!suggestion.trim()) return
    setIsSuggesting(true)
    setSuggestionError("")
    try {
      const res = await fetch(`/api/vote/${token}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: suggestion.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSuggestionError(data.error ?? "Could not add suggestion.")
        return
      }
      const newOpt = await res.json()
      setOptions((prev) => [...prev, { id: newOpt.id, label: newOpt.label, dateValue: null, endDate: null }])
      // Someone who proposes an option is saying it works for them.
      setSelectedIds((prev) => (multiSelect ? [...prev, newOpt.id] : [newOpt.id]))
      setSuggestion("")
    } catch {
      setSuggestionError("Something went wrong.")
    } finally {
      setIsSuggesting(false)
    }
  }

  if (pollType === "YES_NO_VETO") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">
          {hasVoted ? `Your answer, ${firstName} — change it if you like:` : `Your answer, ${firstName}:`}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "YES", label: "Yes!", emoji: "✅" },
            { value: "FINE", label: "Fine by me", emoji: "🤷" },
            { value: "NO", label: "Hard no", emoji: "❌" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setChoice(opt.value); setError("") }}
              className={`rounded-xl border-2 py-4 text-center transition-all ${
                choice === opt.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="mt-1 text-sm font-medium text-gray-700">{opt.label}</div>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleVote}
          disabled={isPending || !choice}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? "Saving…" : hasVoted ? "Update my answer" : "Submit vote"}
        </button>
        <div className="text-center space-y-2">
          {hasVoted && (
            <a href={`/vote/${token}/results`} className="block text-sm text-indigo-600 hover:underline">
              See where it stands
            </a>
          )}
          <a href={optOutUrl} className="text-sm text-gray-400 hover:text-gray-600 underline">
            I&apos;m out — remove me from this poll
          </a>
        </div>
      </div>
    )
  }

  if (pollType === "TIME_POLL") {
    const answered = Object.keys(preferences).length
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {hasVoted
              ? `Your availability, ${firstName} — update any slot:`
              : `How does each time work, ${firstName}?`}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            Mark the times you can make. Leave the others unavailable.
          </p>
        </div>
        {options.map((option) => {
          const current = preferences[option.id]
          return (
            <div key={option.id} className="rounded-xl border-2 border-gray-200 bg-white p-4">
              <p className="font-medium text-gray-900">{option.label}</p>
              {option.dateValue && timeZone && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatTimeSlot(option.dateValue, option.endDate, timeZone)}
                </p>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={option.label}>
                {[
                  { value: "IDEAL" as const, label: "Ideal", tone: "border-green-500 bg-green-50 text-green-800" },
                  { value: "AVAILABLE" as const, label: "Works", tone: "border-indigo-500 bg-indigo-50 text-indigo-800" },
                  { value: null, label: "Can't", tone: "border-gray-400 bg-gray-50 text-gray-700" },
                ].map((item) => {
                  const selected = current === item.value || (!current && item.value === null)
                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setPreferences((previous) => {
                          const next = { ...previous }
                          if (item.value) next[option.id] = item.value
                          else delete next[option.id]
                          return next
                        })
                        setError("")
                      }}
                      className={`rounded-lg border-2 px-2 py-2 text-sm font-medium ${
                        selected ? item.tone : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleVote}
          disabled={isPending || answered === 0}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? "Saving…" : hasVoted ? "Update my availability" : "Submit availability"}
        </button>
        <div className="text-center space-y-2">
          {hasVoted && (
            <a href={`/vote/${token}/results`} className="block text-sm text-indigo-600 hover:underline">
              See where it stands
            </a>
          )}
          <a href={optOutUrl} className="text-sm text-gray-400 hover:text-gray-600 underline">
            I&apos;m out — remove me from this poll
          </a>
        </div>
      </div>
    )
  }

  const count = selectedIds.length

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700">
          {hasVoted
            ? multiSelect
              ? `The dates you picked, ${firstName} — add or remove any:`
              : `Your pick, ${firstName} — change it if you like:`
            : multiSelect
              ? `Pick every date that works, ${firstName}:`
              : `Pick one, ${firstName}:`}
        </p>
        {multiSelect && (
          <p className="text-sm text-gray-500 mt-0.5">
            Select as many as you can make — the date that suits the most people wins.
          </p>
        )}
      </div>
      {options.map((opt) => {
        const isSelected = selectedIds.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            role={multiSelect ? "checkbox" : "radio"}
            aria-checked={isSelected}
            onClick={() => toggleOption(opt.id)}
            className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all flex items-center gap-3 ${
              isSelected
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {multiSelect && (
              <span
                aria-hidden
                className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-md border-2 text-xs font-bold text-white transition-colors ${
                  isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300 bg-white"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-medium text-gray-900">{opt.label}</span>
              {opt.dateValue && (
                <span className="block text-sm text-gray-500 mt-0.5">{formatDateRange(opt.dateValue, opt.endDate)}</span>
              )}
            </span>
          </button>
        )
      })}
      {allowSuggestions && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-gray-600">Don&apos;t see the right option? Suggest one:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Your suggestion…"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting || !suggestion.trim()}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
            >
              {isSuggesting ? "Adding…" : "Add"}
            </button>
          </div>
          {suggestionError && <p className="text-xs text-red-600">{suggestionError}</p>}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleVote}
        disabled={isPending || count === 0}
        className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {isPending
          ? "Saving…"
          : hasVoted
            ? multiSelect && count > 0
              ? `Update to ${count} date${count === 1 ? "" : "s"}`
              : "Update my vote"
            : multiSelect && count > 0
              ? `Submit ${count} date${count === 1 ? "" : "s"}`
              : "Submit vote"}
      </button>
      <div className="text-center space-y-2">
        {hasVoted && (
          <a href={`/vote/${token}/results`} className="block text-sm text-indigo-600 hover:underline">
            See where it stands
          </a>
        )}
        <a href={optOutUrl} className="text-sm text-gray-400 hover:text-gray-600 underline">
          I&apos;m out — remove me from this poll
        </a>
      </div>
    </div>
  )
}
