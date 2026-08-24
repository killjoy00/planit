"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  token: string
  email: string
  pollTitle: string
  expired: boolean
  closed: boolean
}

/**
 * Nothing here fires on load. The link in the email lands on this page, and
 * only the button spends the token — so a scanner or a prefetch cannot
 * consume someone's confirmation before they have seen it.
 */
export function VerifyJoinConfirm({ token, email, pollTitle, expired, closed }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  if (closed) {
    return (
      <>
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900">This poll is closed</h1>
        <p className="text-gray-600">Voting on {pollTitle} has ended.</p>
      </>
    )
  }

  if (expired) {
    return (
      <>
        <div className="text-5xl">⌛</div>
        <h1 className="text-2xl font-bold text-gray-900">This link expired</h1>
        <p className="text-gray-600">
          Confirmation links last 24 hours. Open the share link again to get a fresh one.
        </p>
      </>
    )
  }

  async function handleConfirm() {
    setIsPending(true)
    setError("")
    try {
      const res = await fetch(`/api/join/verify/${token}`, { method: "POST" })
      const body = await res.json()
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Something went wrong.")
        return
      }
      router.push(body.voteUrl)
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <div className="text-5xl">🗳️</div>
      <h1 className="text-2xl font-bold text-gray-900">Confirm to vote</h1>
      <p className="text-gray-600">
        This confirms <strong>{email}</strong> and takes you straight to your ballot for{" "}
        <strong>{pollTitle}</strong>.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {isPending ? "Confirming…" : "Confirm and vote"}
      </button>
    </>
  )
}
