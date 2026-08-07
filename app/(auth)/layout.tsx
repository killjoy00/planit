import type { Metadata } from "next"

/** Sign-in is a form, not published content: no index, no ads. */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
