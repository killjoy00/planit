"use client"

import { useEffect, useRef } from "react"

/**
 * Renders a single responsive AdSense unit and asks the tag to fill it once.
 * The ref guard stops a second push in React's development double-effect,
 * which AdSense rejects as "already have ads in this element".
 */
export function AdSlot({ client, slot }: { client: string; slot: string }) {
  const filled = useRef(false)

  useEffect(() => {
    if (filled.current) return
    filled.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle ?? []).push({})
    } catch {
      // The tag may be blocked; an unfilled slot collapses to nothing.
    }
  }, [])

  return (
    <ins
      className="adsbygoogle block"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
