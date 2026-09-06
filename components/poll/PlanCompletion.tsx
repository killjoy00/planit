"use client"

import { useState } from "react"

interface Props {
  title: string
  winnerLabel: string
  when: string | null
  location: string | null
  notes: string | null
  calendarUrl: string | null
}

export function PlanCompletion({ title, winnerLabel, when, location, notes, calendarUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const lines = [
    `${title}: ${winnerLabel}`,
    when,
    location ? `Where: ${location}` : null,
    notes,
  ].filter((line): line is string => !!line)
  const text = lines.join("\n")

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      window.prompt("Copy the final plan:", text)
    }
  }

  return (
    <section className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">The plan is set</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">{winnerLabel}</h2>
          {when && <p className="mt-1 text-sm text-gray-600">{when}</p>}
          {location && <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Where:</span> {location}</p>}
          {notes && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{notes}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {calendarUrl && (
            <a href={calendarUrl} className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
              Add to calendar
            </a>
          )}
          <button type="button" onClick={share} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            {copied ? "Plan copied" : "Share final plan"}
          </button>
        </div>
      </div>
    </section>
  )
}
