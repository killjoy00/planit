"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDateRange } from "@/lib/time-zones"

/**
 * A working poll, entirely client-side.
 *
 * Every other public page describes planit; nothing shows it running. That
 * gap is a real thing to fix on its own — and a plausible read of an AdSense
 * "low value content" decline: a reviewer clicking around finds a marketing
 * site and a sign-up wall, with nothing in between proving there is a
 * working tool behind it. The actual product lives behind a login for
 * privacy, correctly, so this is a second, honest instance of the same
 * screens a real invitee sees — not a recording of one.
 *
 * No network call anywhere in this file. Voting, tallying and picking a
 * winner all happen in local state, so this page carries no load, cannot be
 * spammed into corrupting anything, and needs no backend of its own to stay
 * up. It is not wired to `db`, `EmailSendAttempt`, or `/admin` — nothing here
 * shows up as a real poll, a real user, or a real vote anywhere else in the
 * app.
 */

interface DemoOption {
  id: string
  label: string
  dateValue: string
}

const OPTIONS: DemoOption[] = [
  { id: "mon", label: "Monday", dateValue: "2026-09-14" },
  { id: "tue", label: "Tuesday", dateValue: "2026-09-15" },
  { id: "wed", label: "Wednesday", dateValue: "2026-09-16" },
  { id: "thu", label: "Thursday", dateValue: "2026-09-17" },
]

/** What two other invitees already picked, before "you" vote. */
const OTHER_VOTES: Record<string, string[]> = {
  Bo: ["mon", "wed"],
  Cy: ["tue", "wed"],
}

const TOTAL_INVITED = 3 // Bo, Cy, and you

export function DemoPoll() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  function toggleOption(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function reset() {
    setSelectedIds([])
    setSubmitted(false)
  }

  const counts = new Map(OPTIONS.map((opt) => [opt.id, 0]))
  for (const picks of Object.values(OTHER_VOTES)) {
    for (const id of picks) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  if (submitted) {
    for (const id of selectedIds) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const maxCount = Math.max(...counts.values())
  // Ties go to the earliest option, same rule the real poll uses.
  const winnerId = submitted && maxCount > 0 ? OPTIONS.find((opt) => counts.get(opt.id) === maxCount)!.id : null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Live sandbox &mdash; nothing here is saved, emailed, or shared
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500">Priya&apos;s plan</p>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Team dinner this week</h2>
          <p className="mt-3 text-sm text-gray-400">
            {submitted ? TOTAL_INVITED : 2} of {TOTAL_INVITED} people have voted
            {submitted ? "" : " so far"}
          </p>
        </div>

        {submitted && winnerId && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-6 text-center">
            <p className="text-sm text-indigo-600 font-medium uppercase tracking-wide">Winner</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {OPTIONS.find((opt) => opt.id === winnerId)!.label}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {formatDateRange(OPTIONS.find((opt) => opt.id === winnerId)!.dateValue)}
            </p>
          </div>
        )}

        {!submitted ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Pick every date that works, you:</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Select as many as you can make &mdash; the date that suits the most people wins.
              </p>
            </div>
            {OPTIONS.map((opt) => {
              const isSelected = selectedIds.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleOption(opt.id)}
                  className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all flex items-center gap-3 ${
                    isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-md border-2 text-xs font-bold text-white transition-colors ${
                      isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900">{opt.label}</span>
                    <span className="block text-sm text-gray-500 mt-0.5">{formatDateRange(opt.dateValue)}</span>
                  </span>
                </button>
              )
            })}
            <button
              onClick={() => setSubmitted(true)}
              disabled={selectedIds.length === 0}
              className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {selectedIds.length > 0
                ? `Submit ${selectedIds.length} date${selectedIds.length === 1 ? "" : "s"}`
                : "Submit vote"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">Final count</p>
            {OPTIONS.map((opt) => {
              const count = counts.get(opt.id) ?? 0
              const pct = Math.round((count / TOTAL_INVITED) * 100)
              const mine = selectedIds.includes(opt.id)
              const won = opt.id === winnerId
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-gray-800 min-w-0">
                      <span className="block truncate">
                        {opt.label}
                        {mine && <span className="ml-1.5 text-xs text-indigo-600">· your pick</span>}
                      </span>
                      <span className="block text-xs text-gray-400">{formatDateRange(opt.dateValue)}</span>
                    </span>
                    <span className="text-sm text-gray-500 shrink-0 tabular-nums">{count}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${won ? "bg-indigo-600" : mine ? "bg-indigo-400" : "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="text-center pt-2">
              <button onClick={reset} className="text-sm text-indigo-600 hover:underline">
                Try it again with different dates
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-center">
        <p className="text-sm text-gray-600">
          This is exactly what your friends see &mdash; from their inbox, no account needed.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Start a real one →
        </Link>
      </div>
    </div>
  )
}
