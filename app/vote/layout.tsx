import type { Metadata } from "next"

/**
 * Voting happens through a private, unguessable per-participant link. These
 * screens hold one person's ballot and a confirmation message — nothing to
 * index, and nothing that may carry Google-served ads.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
