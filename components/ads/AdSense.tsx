import Script from "next/script"
import { AdSlot } from "./AdSlot"

const CLIENT = "ca-pub-1217971050094766"

/** Slot ids are configured per-deploy; unset means "don't render a unit". */
export const ARTICLE_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT

/**
 * Loads the AdSense tag. This belongs *only* in the public content layout.
 *
 * AdSense policy forbids Google-served ads on screens without publisher
 * content — the sign-in screen, the signed-in app, and the voting and
 * confirmation screens all qualify. Keeping the tag out of the root layout
 * means Auto ads can never place a unit on one of them.
 */
export function AdSenseScript() {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}

/**
 * An explicitly placed in-article unit. Renders nothing until a slot id is
 * configured, so a missing env var leaves a clean page rather than an empty box.
 */
export function ArticleAd() {
  if (!ARTICLE_AD_SLOT) return null

  return (
    <aside className="my-12 border-y border-gray-100 py-4">
      <p className="mb-2 text-center text-[11px] uppercase tracking-widest text-gray-300">
        Advertisement
      </p>
      <AdSlot client={CLIENT} slot={ARTICLE_AD_SLOT} />
    </aside>
  )
}
