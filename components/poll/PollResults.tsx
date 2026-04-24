"use client"

import { useState, useEffect, useTransition } from "react"

interface Option { id: string; label: string; dateValue: string | null; endDate: string | null; voteCount: number }
interface Participant { id: string; name: string; email: string; voted: boolean; optedOut: boolean; vote: { optionId: string | null; choice: string | null } | null }
interface Winner { id: string; label: string; dateValue: string | null; endDate: string | null }

interface ResultsData {
  status: string
  winnerId: string | null
  winner: Winner | null
  options: Option[]
  participants: Participant[]
}

interface Props {
  pollId: string
  initialData: ResultsData
  pollType: string
  pollTitle: string
  icsAvailable: boolean
  pollIdForIcs: string
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null
  const s = new Date(start)
  if (!end) return s.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  const e = new Date(end)
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`
}

export function PollResults({ pollId, initialData, pollType, pollTitle, icsAvailable: initialIcsAvailable, pollIdForIcs }: Props) {
  const [data, setData] = useState(initialData)
  const [isClosing, startClose] = useTransition()

  // Hydrate vote counts from participants
  function hydrated(d: ResultsData): ResultsData {
    const counts = new Map<string, number>()
    for (const p of d.participants) {
      if (p.vote?.optionId) counts.set(p.vote.optionId, (counts.get(p.vote.optionId) ?? 0) + 1)
    }
    return { ...d, options: d.options.map((o) => ({ ...o, voteCount: counts.get(o.id) ?? 0 })) }
  }

  useEffect(() => {
    if (data.status !== "OPEN") return
    const iv = setInterval(async () => {
      const res = await fetch(`/api/polls/${pollId}/results`)
      if (res.ok) setData(hydrated(await res.json()))
    }, 10000)
    return () => clearInterval(iv)
  }, [pollId, data.status])

  const h = hydrated(data)
  const voted = h.participants.filter((p) => p.voted && !p.optedOut).length
  const total = h.participants.filter((p) => !p.optedOut).length
  const maxVotes = Math.max(...h.options.map((o) => o.voteCount), 1)

  async function handleClose() {
    startClose(async () => {
      const res = await fetch(`/api/polls/${pollId}/close`, { method: "POST" })
      if (res.ok) {
        const fresh = await fetch(`/api/polls/${pollId}/results`)
        if (fresh.ok) setData(hydrated(await fresh.json()))
      }
    })
  }

  return (
    <div className="space-y-6">
      {h.status === "CLOSED" && h.winner && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-6 text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Winner</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{h.winner.label}</p>
          {formatDateRange(h.winner.dateValue, h.winner.endDate) && (
            <p className="text-gray-500 mt-1">{formatDateRange(h.winner.dateValue, h.winner.endDate)}</p>
          )}
          {(initialIcsAvailable || h.winner.dateValue) && (
            <a
              href={`/api/polls/ics/${pollIdForIcs}`}
              className="mt-3 inline-block text-sm text-indigo-600 underline"
            >
              Add to calendar (.ics)
            </a>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">{voted} / {total} voted</p>
          {h.status === "OPEN" && (
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              {isClosing ? "Closing…" : "Close poll"}
            </button>
          )}
        </div>

        {pollType !== "YES_NO_VETO" ? (
          <div className="space-y-3">
            {h.options.map((opt) => {
              const dateStr = formatDateRange(opt.dateValue, opt.endDate)
              return (
                <div key={opt.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="font-medium text-gray-800">{opt.label}</span>
                      <span className="text-gray-500">{opt.voteCount}</span>
                    </div>
                    {dateStr && <p className="text-xs text-gray-400 mb-1">{dateStr}</p>}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${opt.voteCount === maxVotes && opt.voteCount > 0 ? "bg-indigo-500" : "bg-gray-300"}`}
                        style={{ width: `${(opt.voteCount / maxVotes) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-4">
            {["YES", "FINE", "NO"].map((c) => {
              const count = h.participants.filter((p) => p.vote?.choice === c).length
              return (
                <div key={c} className="flex-1 text-center rounded-xl border border-gray-200 py-3">
                  <p className="text-2xl">{c === "YES" ? "✅" : c === "FINE" ? "🤷" : "❌"}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
                  <p className="text-xs text-gray-400">{c}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Participants</h3>
        <div className="space-y-1">
          {h.participants.map((p) => {
            const votedOption = p.vote?.optionId ? h.options.find((o) => o.id === p.vote?.optionId) : null
            return (
              <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                <div>
                  <span className={`font-medium ${p.optedOut ? "text-gray-400 line-through" : "text-gray-800"}`}>{p.name}</span>
                  {votedOption && pollType !== "YES_NO_VETO" && (
                    <span className="ml-2 text-xs text-indigo-500">{votedOption.label}</span>
                  )}
                </div>
                <span className={`text-xs ${p.optedOut ? "text-gray-400" : p.voted ? "text-green-600" : "text-amber-500"}`}>
                  {p.optedOut ? "Opted out" : p.voted ? "Voted" : "Pending"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
