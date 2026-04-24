import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-lg">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">planit</h1>
        <p className="mt-4 text-xl text-gray-600">
          Stop re-adding everyone. Stop chasing responses. Vote on what to do next — your friends vote by email, no account needed.
        </p>
        <ul className="mt-6 space-y-2 text-left text-gray-600 text-base">
          <li>✓ Persistent groups — add once, use every time</li>
          <li>✓ Three escalating reminders, then the group moves on</li>
          <li>✓ &quot;I&apos;m out&quot; is a first-class answer</li>
        </ul>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Start planning →
        </Link>
        <p className="mt-3 text-sm text-gray-400">Free. No credit card.</p>
      </div>
    </main>
  )
}
