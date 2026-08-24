import type { Metadata } from "next"

/**
 * Share links are handed out privately and there is nothing here for a
 * crawler, so the group is `noindex` like the voting pages.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col">{children}</div>
}
