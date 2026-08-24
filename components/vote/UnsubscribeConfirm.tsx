"use client"

import { useState } from "react"

interface Props {
  token: string
  email: string
  alreadyUnsubscribed: boolean
}

/**
 * The page a human lands on from the footer link, or from a GET on the
 * One-Click endpoint. Nothing here fires on load — leaving has to be a choice
 * the reader makes, not something their mail client did on their behalf.
 */
export function UnsubscribeConfirm({ token, email, alreadyUnsubscribed }: Props) {
  const [done, setDone] = useState(alreadyUnsubscribed)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function handleUnsubscribe() {
    setIsPending(true)
    setError("")
    try {
      const res = await fetch(`/api/unsubscribe/${token}`, { method: "POST" })
      if (!res.ok) {
        setError("Could not unsubscribe. Please try again.")
        return
      }
      setDone(true)
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsPending(false)
    }
  }

  if (done) {
    return (
      <>
        <div className="text-5xl">✉️</div>
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re unsubscribed</h1>
        <p className="text-gray-600">
          We won&apos;t email <strong>{email}</strong> again — no invitations, no reminders,
          no results. Anyone who adds you to a plan will have to reach you another way.
        </p>
      </>
    )
  }

  return (
    <>
      <div className="text-5xl">✉️</div>
      <h1 className="text-2xl font-bold text-gray-900">Unsubscribe from planit?</h1>
      <p className="text-gray-600">
        This stops every planit email to <strong>{email}</strong> — invitations from
        anyone, reminders, and results. To leave just one plan instead, use the
        &ldquo;I&apos;m out&rdquo; link on that poll.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleUnsubscribe}
        disabled={isPending}
        className="w-full rounded-xl bg-gray-900 py-4 text-base font-semibold text-white hover:bg-gray-800 disabled:opacity-40 transition-colors"
      >
        {isPending ? "Unsubscribing…" : "Unsubscribe me from all planit email"}
      </button>
    </>
  )
}
