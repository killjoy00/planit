"use client"

import { useState } from "react"

interface Props {
  shareToken: string
}

export function JoinForm({ shareToken }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<null | "sent" | "resent">(null)
  const [sentTo, setSentTo] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.")
      return
    }
    setIsPending(true)
    setError("")
    try {
      const res = await fetch(`/api/join/${shareToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Something went wrong.")
        return
      }
      setSentTo(body.email ?? email.trim())
      setStatus(body.status)
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsPending(false)
    }
  }

  if (status === "resent") {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center space-y-2">
        <p className="text-3xl">📨</p>
        <h2 className="font-semibold text-gray-900">Fresh voting link sent</h2>
        <p className="text-sm text-gray-600">
          You were already invited, so we sent a new copy of your personal voting link to{" "}
          <strong>{sentTo}</strong>. The organizer can also send that link to you directly.
        </p>
      </div>
    )
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center space-y-2">
        <p className="text-3xl">📨</p>
        <h2 className="font-semibold text-gray-900">Check your email</h2>
        <p className="text-sm text-gray-600">
          We sent a confirmation link to <strong>{sentTo}</strong>. Click it and you can vote.
          It&apos;s good for 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Join this poll:</p>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {isPending ? "Sending…" : "Confirm my email to vote"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        We check the address so votes come from real people. Nothing else is sent unless
        you ask for it.
      </p>
    </form>
  )
}
