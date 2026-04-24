"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

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
}

export function VotingForm({ token, pollType, options, participantName, optOutUrl }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string>("")
  const [error, setError] = useState("")

  function formatDateRange(start: string, end: string | null) {
    const s = new Date(start)
    if (!end) return s.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    const e = new Date(end)
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`
  }

  async function handleVote() {
    if (!selected) return setError("Please make a selection.")
    setError("")

    startTransition(async () => {
      const body = pollType === "YES_NO_VETO"
        ? { choice: selected }
        : { optionId: selected }

      const res = await fetch(`/api/vote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong.")
        return
      }
      router.push(`/vote/${token}/done`)
    })
  }

  if (pollType === "YES_NO_VETO") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Your answer, {participantName.split(" ")[0]}:</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "YES", label: "Yes!", emoji: "✅" },
            { value: "FINE", label: "Fine by me", emoji: "🤷" },
            { value: "NO", label: "Hard no", emoji: "❌" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`rounded-xl border-2 py-4 text-center transition-all ${
                selected === opt.value
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
          disabled={isPending || !selected}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? "Submitting…" : "Submit vote"}
        </button>
        <div className="text-center">
          <a href={optOutUrl} className="text-sm text-gray-400 hover:text-gray-600 underline">
            I&apos;m out — remove me from this poll
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Pick one, {participantName.split(" ")[0]}:</p>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setSelected(opt.id)}
          className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all ${
            selected === opt.id
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <p className="font-medium text-gray-900">{opt.label}</p>
          {opt.dateValue && (
            <p className="text-sm text-gray-500 mt-0.5">{formatDateRange(opt.dateValue, opt.endDate)}</p>
          )}
        </button>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleVote}
        disabled={isPending || !selected}
        className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {isPending ? "Submitting…" : "Submit vote"}
      </button>
      <div className="text-center">
        <a href={optOutUrl} className="text-sm text-gray-400 hover:text-gray-600 underline">
          I&apos;m out — remove me from this poll
        </a>
      </div>
    </div>
  )
}
