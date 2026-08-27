"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

interface Props {
  pollId: string
  status: string
  title: string
  description: string | null
  deadline: string | null
  threshold: number | null
  reminderSchedule: "AFTER_SEND" | "BEFORE_DEADLINE"
  replyToCreator: boolean
}

function localDateTimeValue(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PollSettings(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(props.title)
  const [description, setDescription] = useState(props.description ?? "")
  const [deadline, setDeadline] = useState(
    props.status === "OPEN" ? localDateTimeValue(props.deadline) : "",
  )
  const [threshold, setThreshold] = useState(props.threshold?.toString() ?? "")
  const [reminderSchedule, setReminderSchedule] = useState(props.reminderSchedule)
  const [replyToCreator, setReplyToCreator] = useState(props.replyToCreator)
  const [error, setError] = useState("")

  async function request(url: string, body: object, method = "POST") {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Something went wrong.")
  }

  function saveSettings() {
    setError("")
    startTransition(async () => {
      try {
        await request(`/api/polls/${props.pollId}`, {
          title,
          description: description.trim() || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          threshold: threshold ? Number(threshold) : null,
          reminderSchedule,
          replyToCreator,
        }, "PATCH")
        setIsEditing(false)
        router.refresh()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong.")
      }
    })
  }

  function changeLifecycle(action: "CANCEL" | "REOPEN") {
    const confirmed = window.confirm(
      action === "CANCEL"
        ? "Cancel this poll? Existing votes will be kept if you reopen it later."
        : "Reopen this poll and continue collecting votes?",
    )
    if (!confirmed) return
    setError("")
    startTransition(async () => {
      try {
        await request(`/api/polls/${props.pollId}/lifecycle`, {
          action,
          deadline: action === "REOPEN" && deadline ? new Date(deadline).toISOString() : null,
        })
        router.refresh()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong.")
      }
    })
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Manage poll</h2>
          <p className="mt-0.5 text-xs text-gray-500">Update the poll, manage its lifecycle, or reuse it.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/polls/new?duplicate=${props.pollId}`} className="text-indigo-600 hover:underline">
            Plan this again
          </Link>
          {props.status === "OPEN" && (
            <button type="button" onClick={() => setIsEditing((value) => !value)} className="text-indigo-600 hover:underline">
              {isEditing ? "Discard edits" : "Edit settings"}
            </button>
          )}
          {props.status === "OPEN" ? (
            <button type="button" onClick={() => changeLifecycle("CANCEL")} disabled={isPending} className="text-red-600 hover:underline disabled:opacity-50">
              Cancel poll
            </button>
          ) : (
            <button type="button" onClick={() => changeLifecycle("REOPEN")} disabled={isPending} className="text-indigo-600 hover:underline disabled:opacity-50">
              Reopen poll
            </button>
          )}
        </div>
      </div>

      {(isEditing || props.status !== "OPEN") && (
        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
          {isEditing && (
            <>
              <label className="text-sm text-gray-700 sm:col-span-2">
                Title
                <input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm text-gray-700 sm:col-span-2">
                Description
                <textarea value={description} maxLength={5000} rows={2} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
            </>
          )}
          <label className="text-sm text-gray-700">
            {props.status === "OPEN" ? "Deadline" : "New deadline (optional)"}
            <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          {isEditing && (
            <>
              <label className="text-sm text-gray-700">
                Auto-close after votes (optional)
                <input type="number" min={1} value={threshold} onChange={(event) => setThreshold(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm text-gray-700">
                Reminders
                <select value={reminderSchedule} onChange={(event) => setReminderSchedule(event.target.value as Props["reminderSchedule"])} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                  <option value="AFTER_SEND">After invitation</option>
                  <option value="BEFORE_DEADLINE" disabled={!deadline}>Before deadline</option>
                </select>
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                <input type="checkbox" checked={replyToCreator} onChange={(event) => setReplyToCreator(event.target.checked)} />
                Let invitees reply to me
              </label>
              <div className="sm:col-span-2">
                <button type="button" onClick={saveSettings} disabled={isPending || !title.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {isPending ? "Saving…" : "Save settings"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  )
}
