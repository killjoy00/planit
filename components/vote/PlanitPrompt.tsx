"use client"

import Link from "next/link"
import { useState } from "react"

interface Props {
  compact?: boolean
}

export function PlanitPrompt({ compact = false }: Props) {
  const [shared, setShared] = useState(false)

  async function sharePlanit() {
    const url = "https://planitnow.us"
    const text = "This made picking a plan with a group painless — people vote from the link and planit chases the missing replies."
    try {
      if (navigator.share) {
        await navigator.share({ title: "planit", text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShared(true)
      window.setTimeout(() => setShared(false), 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      window.prompt("Share planit:", url)
    }
  }

  return (
    <section className={`rounded-xl border border-indigo-100 bg-white ${compact ? "p-4" : "p-5"}`}>
      <p className="text-sm font-semibold text-gray-900">Your turn to organize?</p>
      <p className="mt-1 text-sm text-gray-500">
        You just voted without an account. Your friends can do the same when you make the next plan.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/login" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Make your own poll
        </Link>
        <button type="button" onClick={sharePlanit} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          {shared ? "Link copied" : "Share planit"}
        </button>
      </div>
    </section>
  )
}
