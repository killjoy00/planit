import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/LoginForm"

/**
 * Someone who is already signed in has no business on the sign-in form.
 *
 * This is also the safety net for magic links that carry `callbackUrl=/login`
 * — every link sent before that default was fixed does, and they are sitting
 * in inboxes. Auth.js signs the reader in and then redirects them here; without
 * this check they land on an email prompt and reasonably conclude the link
 * failed, even though the session was created.
 */
export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
