"use client"

import { useState, useEffect, useCallback, useTransition } from "react"

interface Option { id: string; label: string; dateValue: string | null; endDate: string | null; suggestedByName: string | null; voteCount: number }
interface Participant {
  id: string; name: string; email: string
  voted: boolean; optedOut: boolean; inviteDelivered: boolean
  /** Every option this person picked. Date polls allow more than one. */
  optionIds: string[]
  choice: string | null
}
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

// Hydrate vote counts from participants. One participant can contribute to
// several options on a date poll, but only once to any single option.
function hydrated(d: ResultsData): ResultsData {
  const counts = new Map<string, number>()
  for (const p of d.participants) {
    for (const optionId of new Set(p.optionIds)) {
      counts.set(optionId, (counts.get(optionId) ?? 0) + 1)
    }
  }
  return { ...d, options: d.options.map((o) => ({ ...o, voteCount: counts.get(o.id) ?? 0 })) }
}

export function PollResults({ pollId, initialData, pollType, pollTitle, icsAvailable: initialIcsAvailable, pollIdForIcs }: Props) {
  const [data, setData] = useState(initialData)
  const [isClosing, startClose] = useTransition()
  const [showAddInvite, setShowAddInvite] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [addSuccess, setAddSuccess] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendNote, setResendNote] = useState("")

  const refresh = useCallback(async () => {
    const fresh = await fetch(`/api/polls/${pollId}/results`)
    if (fresh.ok) setData(hydrated(await fresh.json()))
  }, [pollId])

  /** Retry the invitations the mail provider refused. */
  async function handleResendInvites() {
    setIsResending(true)
    setResendNote("")
    try {
      const res = await fetch(`/api/polls/${pollId}/resend`, { method: "POST" })
      const body = await res.json()
      if (!res.ok) {
        setResendNote(typeof body.error === "string" ? body.error : "Could not resend.")
        return
      }
      setResendNote(
        body.failed.length > 0
          ? `Sent ${body.sent}. Still undelivered: ${body.failed.length}.`
          : `Sent ${body.sent} invitation${body.sent === 1 ? "" : "s"}.`,
      )
      await refresh()
    } catch {
      setResendNote("Something went wrong.")
    } finally {
      setIsResending(false)
    }
  }

  async function handleAddInvite() {
    if (!newName.trim() || !newEmail.trim()) {
      setAddError("Name and email are both required.")
      return
    }
    setIsAdding(true)
    setAddError("")
    setAddSuccess("")
    try {
      const res = await fetch(`/api/polls/${pollId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitees: [{ name: newName.trim(), email: newEmail.trim() }] }),
      })
      if (!res.ok) {
        const body = await res.json()
        setAddError(typeof body.error === "string" ? body.error : "Could not add participant.")
        return
      }
      setAddSuccess(`Invite sent to ${newEmail.trim()}.`)
      setNewName("")
      setNewEmail("")
      await refresh()
    } catch {
      setAddError("Something went wrong.")
    } finally {
      setIsAdding(false)
    }
  }

  useEffect(() => {
    if (data.status !== "OPEN") return
    const iv = setInterval(refresh, 10000)
    return () => clearInterval(iv)
  }, [refresh, data.status])

  const h = hydrated(data)
  const voted = h.participants.filter((p) => p.voted && !p.optedOut).length
  const total = h.participants.filter((p) => !p.optedOut).length
  const undelivered = h.participants.filter((p) => !p.inviteDelivered && !p.optedOut)
  const maxVotes = Math.max(...h.options.map((o) => o.voteCount), 1)

  async function handleClose() {
    startClose(async () => {
      const res = await fetch(`/api/polls/${pollId}/close`, { method: "POST" })
      if (res.ok) await refresh()
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
                    <div className="flex justify-between text-sm mb-0.5 gap-2">
                      <span className="font-medium text-gray-800">
                        {opt.label}
                        {opt.suggestedByName && (
                          <span className="ml-2 text-xs font-normal text-indigo-500 bg-indigo-50 rounded px-1.5 py-0.5">
                            suggested by {opt.suggestedByName}
                          </span>
                        )}
                      </span>
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
              const count = h.participants.filter((p) => p.choice === c).length
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Participants</h3>
          {h.status === "OPEN" && (
            <button
              onClick={() => setShowAddInvite((v) => !v)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {showAddInvite ? "Cancel" : "+ Invite more"}
            </button>
          )}
        </div>
        {undelivered.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-3 text-sm">
            <p className="text-amber-800">
              {undelivered.length === 1
                ? "1 invitation never reached its recipient"
                : `${undelivered.length} invitations never reached their recipients`}
              : {undelivered.map((p) => p.email).join(", ")}. They cannot vote until
              the invitation arrives — the vote link only travels by email.
            </p>
            {h.status === "OPEN" && (
              <button
                onClick={handleResendInvites}
                disabled={isResending}
                className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isResending ? "Resending…" : "Resend invitations"}
              </button>
            )}
            {resendNote && <p className="mt-2 text-xs text-amber-700">{resendNote}</p>}
          </div>
        )}
        {showAddInvite && h.status === "OPEN" && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleAddInvite}
                disabled={isAdding}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAdding ? "Sending…" : "Send invite"}
              </button>
            </div>
            {addError && <p className="text-xs text-red-600">{addError}</p>}
            {addSuccess && <p className="text-xs text-green-600">{addSuccess}</p>}
          </div>
        )}
        <div className="space-y-1">
          {h.participants.map((p) => {
            const pickedLabels = p.optionIds
              .map((id) => h.options.find((o) => o.id === id)?.label)
              .filter((l): l is string => !!l)
            const shown = pickedLabels.slice(0, 3)
            const extra = pickedLabels.length - shown.length
            return (
              <div key={p.id} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                <div className="min-w-0">
                  <span className={`font-medium ${p.optedOut ? "text-gray-400 line-through" : "text-gray-800"}`}>{p.name}</span>
                  {pickedLabels.length > 0 && pollType !== "YES_NO_VETO" && (
                    <span className="ml-2 text-xs text-indigo-500">
                      {shown.join(", ")}{extra > 0 && ` +${extra} more`}
                    </span>
                  )}
                </div>
                <span className={`text-xs shrink-0 ${
                  p.optedOut ? "text-gray-400"
                    : p.voted ? "text-green-600"
                    : p.inviteDelivered ? "text-amber-500"
                    : "text-red-600"
                }`}>
                  {p.optedOut ? "Opted out"
                    : p.voted ? "Voted"
                    : p.inviteDelivered ? "Pending"
                    : "Not delivered"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
