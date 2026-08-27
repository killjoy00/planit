"use client"

import { useState } from "react"

interface Props {
  token: string
  email: string
  callbackUrl?: string
}

/**
 * Nothing here fires on load, and the page holds no link to the callback —
 * only this button's POST can produce one. Following links, which is all a mail
 * scanner does, no longer signs anybody in.
 */
export function ConfirmSignIn({ token, email, callbackUrl }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    setIsPending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, callbackUrl }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Something went wrong.")
        return
      }
      // A full navigation, not a client-side push: the callback is what sets
      // the session cookie, and the app has to load with it in place.
      window.location.href = body.url
    } catch {
      setError("Something went wrong. Please try again.")
      setIsPending(false)
    }
  }

  return (
    <>
      {error && (
        <p className="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>
      )}
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="mt-6 block w-full rounded-lg bg-indigo-600 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? "Signing you in…" : "Sign in to planit →"}
      </button>
    </>
  )
}
