"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, useActionState, Suspense } from "react"

function LoginForm() {
  const params = useSearchParams()
  const verified = params.get("verify") === "1"
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setPending(true)
    await signIn("resend", { email, redirect: false })
    setSent(true)
    setPending(false)
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
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
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

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
