import { AdSenseScript } from "@/components/ads/AdSense"
import { ContentHeader } from "@/components/content/ContentHeader"

/**
 * Layout for the published, publicly readable part of the site: the home page,
 * the guides, the FAQ, and About.
 *
 * This is the only place the AdSense tag is loaded. Everything outside this
 * route group — sign-in, the signed-in app, the voting screens — renders
 * without it, so Google-served ads can never land on a screen whose only job
 * is navigation, data entry, or a confirmation message.
 */
export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContentHeader />
      {children}
      <AdSenseScript />
    </>
  )
}
