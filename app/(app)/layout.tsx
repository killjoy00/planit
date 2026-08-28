import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { isAdminEmail } from "@/lib/admin"
import { AppNavigation } from "@/components/ui/AppNavigation"

/**
 * Everything behind sign-in is the product, not published content: it is kept
 * out of the index, and the AdSense tag is never loaded here.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex-1 bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
            planit
          </Link>
          <AppNavigation showAdmin={isAdminEmail(session.user.email)} />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">{children}</main>
    </div>
  )
}
