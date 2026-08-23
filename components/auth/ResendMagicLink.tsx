"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

/**
 * Offered on the confirmation page when a link turns out to be dead. The
 * address is already known from the link itself, so getting a fresh one is a
 * single press rather than a trip back to /login to retype it.
 */
export function ResendMagicLink({
  email,
  callbackUrl,
}: {
  email: string
  callbackUrl?: string
}) {
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleResend() {
    setPending(true)
    setError("")
    try {
      const result = await signIn("resend", { email, callbackUrl, redirect: false })
      if (result?.error) {
        setError("We couldn't send that. Please try again in a moment.")
      } else {
        setSent(true)
      }
    } catch {
      setError("We couldn't send that. Please try again in a moment.")
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-3 text-sm text-green-700">
        Sent — a fresh link is on its way to <strong>{email}</strong>.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleResend}
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "Sending…" : "Send a new link"}
      </button>
      {/* The address goes under the button, not inside it: long ones overflow. */}
      <p className="text-center text-sm text-gray-500">
        to <strong className="break-all">{email}</strong>
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
