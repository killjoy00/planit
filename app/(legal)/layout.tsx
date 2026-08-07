import { ContentHeader } from "@/components/content/ContentHeader"

/**
 * Privacy and terms. Public and navigable, but they are supporting documents
 * rather than published content, so the AdSense tag is deliberately absent.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContentHeader />
      {children}
    </>
  )
}
