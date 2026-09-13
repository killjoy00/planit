"use client"

import { useState } from "react"

interface Props {
  shareToken: string
}

export function FastJoinForm({ shareToken }: Props) {
  const [name, setName] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError("Enter your name to vote.")
      return
    }

    setIsPending(true)
    setError("")
    try {
      const response = await fetch(`/api/join/${shareToken}/fast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const body = await response.json()
      if (!response.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not join this poll.")
        return
      }
      window.location.assign(body.voteUrl)
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">Vote now</p>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          No account and no email required. Enter the name your group will recognize.
        </p>
      </div>
      <input
        type="text"
        required
        maxLength={80}
        autoComplete="name"
        placeholder="Your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
      >
        {isPending ? "Opening ballot…" : "Continue to ballot →"}
      </button>
      <p className="text-center text-xs leading-5 text-gray-400">
        Fast join does not send reminders or result emails. Come back to this shared link to see the final plan.
      </p>
    </form>
  )
}
