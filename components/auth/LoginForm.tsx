"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

/**
 * Auth.js redirects its failures here (`pages.error` in `auth.config.ts`).
 * `Verification` is the common one: a magic link that expired or was already
 * spent, arriving from the callback rather than the confirmation page.
 */
const AUTH_ERRORS: Record<string, string> = {
  Verification:
    "That sign-in link is no longer valid — it either expired or was already used. Enter your email and we'll send a fresh one.",
  // The only thing that refuses a send is the rate limit in `lib/auth.ts`, so
  // this is what AccessDenied means here in practice.
  AccessDenied:
    "We've just sent a link to that address, or it has been asked for too many times. Give it a minute and check your inbox — including spam.",
  Configuration: "Sign-in is temporarily unavailable. Please try again in a moment.",
}

/** Where to land after a successful sign-in, when nothing else asked for a page. */
const DEFAULT_CALLBACK_URL = "/dashboard"

export function LoginForm() {
  const params = useSearchParams()
  const verified = params.get("verify") === "1"
  const errorCode = params.get("error")
  const linkError = errorCode
    ? (AUTH_ERRORS[errorCode] ?? "Something went wrong signing you in. Please try again.")
    : ""

  /**
   * The proxy sends people here as `/login?callbackUrl=<page they wanted>`.
   * Honour that, and otherwise send them to the dashboard — never let this
   * default to the current page, or the magic link signs you in and drops you
   * back on this form, which is indistinguishable from the link having failed.
   */
  const callbackUrl = params.get("callbackUrl") || DEFAULT_CALLBACK_URL

  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setPending(true)
    setError("")
    try {
      const result = await signIn("resend", { email, redirect: false, callbackUrl })
      if (result?.error) {
        // Auth.js hands back a code, not a sentence. Printing it raw showed
        // people "Sign-in failed: AccessDenied", which reads like an
        // accusation when it is usually just the one-a-minute limit.
        setError(AUTH_ERRORS[result.error] ?? "Something went wrong signing you in. Please try again.")
      } else {
        setSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setPending(false)
    }
  }

  if (verified || sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-2xl font-bold text-gray-900">Check your inbox</h2>
        <p className="mt-2 text-gray-600">
          We sent a magic link to <strong>{email || "your email"}</strong>.<br />
          Click it to sign in — no password needed.
        </p>
        <p className="mt-4 text-sm text-gray-400">Wrong address? <button onClick={() => setSent(false)} className="underline">Try again</button></p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center">Sign in to planit</h2>
      <p className="mt-2 text-center text-gray-500 text-sm">We&apos;ll email you a magic link. No password.</p>
      {linkError && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{linkError}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Sending…" : "Send magic link →"}
        </button>
      </form>
    </div>
  )
}
