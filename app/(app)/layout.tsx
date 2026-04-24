import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/ui/SignOutButton"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
            planit
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/groups" className="text-gray-600 hover:text-gray-900">Groups</Link>
            <Link
              href="/polls/new"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              New poll
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
