"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export function OptOutConfirm({ token, pollTitle }: { token: string; pollTitle: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  async function handleOptOut() {
    startTransition(async () => {
      await fetch(`/api/vote/${token}/optout`, { method: "POST" })
      setDone(true)
      router.refresh()
    })
  }

  if (done) {
    return (
      <>
        <div className="text-4xl">👋</div>
        <h1 className="text-xl font-bold text-gray-900">You&apos;re out</h1>
        <p className="text-gray-500">The group will move forward without you.</p>
      </>
    )
  }

  return (
    <>
      <div className="text-4xl">🤔</div>
      <h1 className="text-xl font-bold text-gray-900">Opt out of this poll?</h1>
      <p className="text-gray-500">You won&apos;t be counted for <strong>{pollTitle}</strong> and won&apos;t receive further reminders.</p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go back
        </button>
        <button
          onClick={handleOptOut}
          disabled={isPending}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "…" : "Yes, I&apos;m out"}
        </button>
      </div>
    </>
  )
}
