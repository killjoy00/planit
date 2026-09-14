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

        <div className="mt-16 border-t border-gray-100 pt-12">
          <h2 className="text-xl font-bold text-gray-900">What just happened</h2>
          <p className="mt-3 text-gray-600">
            The ballot above is the real DATE_POLL screen. On a live poll, a friend can reach it
            immediately from the shared link after entering their name, or jump straight to it from
            a personal email invitation. This demo runs entirely in your browser. Every tick you made
            was tallied against two other votes that were already in: Bo picked Monday and Wednesday,
            Cy picked Tuesday and Wednesday. Whichever date collects the most ticks wins; a tie goes
            to whichever date comes first, the same rule a real poll uses to avoid a runoff nobody
            asked for.
          </p>
          <p className="mt-4 text-gray-600">
            Nothing you clicked was sent anywhere &mdash; there is no server call in this page, so
            it cannot end up in an inbox, a database, or the{" "}
            <Link href="/about" className="text-indigo-600 hover:underline">
              usage numbers
            </Link>{" "}
            behind the product. A real poll uses the same ballot: people can arrive through the
            shared Fast Join link or through their personal voting link, and the organizer gets one
            result everyone can return to.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            More on the mechanics:{" "}
            <Link href="/guides/pick-a-date-everyone-can-make" className="text-indigo-600 hover:underline">
              how many date options to offer
            </Link>{" "}
            and{" "}
            <Link href="/guides/breaking-a-deadlock" className="text-indigo-600 hover:underline">
              what to do when a vote ties for real
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
