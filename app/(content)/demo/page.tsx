import type { Metadata } from "next"
import Link from "next/link"
import { DemoPoll } from "@/components/content/DemoPoll"

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "Try a real planit poll right here — pick your dates, submit, and see the winner, with no account and nothing sent anywhere.",
  alternates: { canonical: "/demo" },
}

export default function DemoPage() {
  return (
    <main className="flex-1 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Try it yourself
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            This is a real planit ballot, not a screenshot. Vote on the dates below and watch the
            results update &mdash; it&apos;s the same screen your friends would see, minus the
            group dinner.
          </p>
        </div>

        <div className="mt-10">
          <DemoPoll />
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Ready for a poll that actually goes to your friends?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            Start one for free
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
