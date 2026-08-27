import type { Metadata } from "next"
import Link from "next/link"
import { ConfirmSignIn } from "@/components/auth/ConfirmSignIn"
import { ResendMagicLink } from "@/components/auth/ResendMagicLink"
import { peekVerificationToken } from "@/lib/magic-link"

export const metadata: Metadata = {
  title: "Confirm sign-in",
  robots: { index: false, follow: false },
}

/** The token lives in the query string, so there is nothing to cache or prerender. */
export const dynamic = "force-dynamic"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        {children}
      </div>
    </main>
  )
}

export default async function ConfirmPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const token = first(params.token)
  const email = first(params.email)
  const callbackUrl = first(params.callbackUrl)

  if (!token || !email) {
    return (
      <Card>
        <div className="text-center">
          <div className="mb-4 text-4xl">🤔</div>
          <h1 className="text-2xl font-bold text-gray-900">Incomplete link</h1>
          <p className="mt-2 text-gray-600">
            This sign-in link is missing part of itself — email apps sometimes cut long
            links in half. Copy the whole thing, or ask for a new one.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-indigo-600 underline">
            Back to sign in
          </Link>
        </div>
      </Card>
    )
  }

  const state = await peekVerificationToken({ token, email })

  if (state !== "valid") {
    return (
      <Card>
        <div className="text-center">
          <div className="mb-4 text-4xl">⌛</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {state === "expired" ? "This link expired" : "This link was already used"}
          </h1>
          <p className="mt-2 mb-6 text-gray-600">
            {state === "expired"
              ? "Sign-in links last 24 hours. Here's a fresh one, no retyping required."
              : "Each link signs you in once. Grab a new one below."}
          </p>
        </div>
        <ResendMagicLink email={email} callbackUrl={callbackUrl} />
        <p className="mt-4 text-center text-sm text-gray-400">
          Wrong address?{" "}
          <Link href="/login" className="underline">
            Use a different one
          </Link>
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="text-center">
        <div className="mb-4 text-4xl">🔐</div>
        <h1 className="text-2xl font-bold text-gray-900">Confirm sign-in</h1>
        <p className="mt-2 text-gray-600">
          You&apos;re signing in as <strong className="break-all">{email}</strong>.
        </p>
      </div>
      {/*
        No link to the callback appears on this page at all — not an anchor,
        not a next/link. The callback signs you in on a GET, so any link to it
        here is one a mail scanner can follow, and enterprise filters follow
        links two hops deep. The button POSTs instead, and only then is the
        callback URL handed back.
      */}
      <ConfirmSignIn token={token} email={email} callbackUrl={callbackUrl} />
      <p className="mt-4 text-center text-sm text-gray-400">
        Didn&apos;t ask to sign in? Close this page — nothing happens until you press the
        button.
      </p>
    </Card>
  )
}
