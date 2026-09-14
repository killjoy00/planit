"use client"

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      Acquisition data could not be loaded. <button type="button" onClick={reset} className="font-medium underline">Try again</button>
    </div>
  )
}
