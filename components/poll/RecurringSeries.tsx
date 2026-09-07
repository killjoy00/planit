"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Cadence = "WEEKLY" | "MONTHLY"

interface Props {
  pollId: string
  status: string
  series: { cadence: Cadence; interval: number; active: boolean } | null
  nextPollId: string | null
  canConfigure: boolean
}

function description(cadence: Cadence, interval: number): string {
  const unit = cadence === "WEEKLY" ? "week" : "month"
  return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`
}

export function RecurringSeries({ pollId, status, series, nextPollId, canConfigure }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cadence, setCadence] = useState<Cadence>(series?.cadence ?? "MONTHLY")
  const [interval, setIntervalValue] = useState(series?.interval ?? 1)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")

  function save() {
    setError("")
    startTransition(async () => {
      const response = await fetch(`/api/polls/${pollId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadence, interval }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setError(typeof body?.error === "string" ? body.error : "Could not save recurrence.")
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  function stop() {
    if (!window.confirm("Stop this recurring series? Existing polls stay as they are.")) return
    setError("")
    startTransition(async () => {
      const response = await fetch(`/api/polls/${pollId}/series`, { method: "DELETE" })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setError(typeof body?.error === "string" ? body.error : "Could not stop the series.")
        return
      }
      router.refresh()
    })
  }

  function retry() {
    setError("")
    startTransition(async () => {
      const response = await fetch(`/api/polls/${pollId}/series/retry`, { method: "POST" })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setError(typeof body?.error === "string" ? body.error : "Could not create the next occurrence.")
        return
      }
      router.refresh()
    })
  }

  const active = !!series?.active

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Recurring series</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {active
              ? `${description(series!.cadence, series!.interval)}. When this occurrence ends, planit opens and sends the next one automatically.`
              : "Turn a repeating dinner, game night, club, or meetup into a series. The current poll becomes the template for the next one."}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          {nextPollId && (
            <Link href={`/polls/${nextPollId}`} className="text-indigo-600 hover:underline">
              Next occurrence →
            </Link>
          )}
          {active && (
            <button type="button" onClick={stop} disabled={isPending} className="text-red-600 hover:underline disabled:opacity-50">
              Stop series
            </button>
          )}
          {status === "OPEN" && canConfigure && (
            <button type="button" onClick={() => setEditing((value) => !value)} className="text-indigo-600 hover:underline">
              {editing ? "Cancel" : active ? "Change" : "Make recurring"}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
          <label className="text-sm text-gray-700">
            Repeat
            <select value={cadence} onChange={(event) => setCadence(event.target.value as Cadence)} className="mt-1 block rounded-lg border border-gray-300 px-3 py-2">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Every
            <input type="number" min={1} max={12} value={interval} onChange={(event) => setIntervalValue(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} className="mt-1 block w-24 rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <span className="pb-2 text-sm text-gray-500">{cadence === "WEEKLY" ? "week(s)" : "month(s)"}</span>
          <button type="button" onClick={save} disabled={isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {isPending ? "Saving…" : "Save series"}
          </button>
        </div>
      )}
      {active && status !== "OPEN" && !nextPollId && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-amber-700">
          <p>The next occurrence has not been created yet &mdash; the last attempt may have failed.</p>
          <button type="button" onClick={retry} disabled={isPending} className="font-medium text-indigo-600 hover:underline disabled:opacity-50">
            {isPending ? "Retrying…" : "Retry now"}
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  )
}
