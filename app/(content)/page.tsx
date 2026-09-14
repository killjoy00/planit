import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { guidesByDate } from "@/lib/guides"
import { useCases } from "@/lib/use-cases"

export const metadata: Metadata = {
  title: { absolute: "planit — group polls people actually answer" },
  description:
    "Free group polls for picking dates, places, and plans. Share one link and friends can vote by name — no account, no app, no endless group chat.",
  alternates: { canonical: "/" },
}

const STEPS = [
  ["1", "Ask one concrete question", "Pick dates, times, or a short list of real options. The group answers the same thing in the same place."],
  ["2", "Send it once", "Invite people by email or share one join link. Shared-link voters can enter a name and vote immediately; no account required."],
  ["3", "Let the decision finish", "Email invitees get targeted reminders. Everyone can come back to the shared link for the final plan."],
]

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  const latest = guidesByDate().slice(0, 3)

  return (
    <main className="flex-1">
      <section className="border-b border-gray-200 bg-stone-50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">One question. One link. One decision.</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            Group plans without the follow-up job
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
            Pick a date or a plan, send it once, and let planit collect the answers. Friends can vote with just a name; use email invitations when you want reminders and results delivered.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/polls/new" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-7 py-3 text-base font-semibold text-white hover:bg-indigo-700">
              Start a poll →
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-7 py-3 text-base font-semibold text-gray-700 hover:border-gray-400">
              Try the voter view
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">Free to start · no credit card · no account required for voters</p>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">Start with what you are organizing</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">A shorter path to the right poll</h2>
            <p className="mt-3 text-gray-600">Choose the job. We will keep the setup focused on the decision you actually need to make.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((item) => (
              <Link key={item.slug} href={`/for/${item.slug}`} className="group rounded-xl border border-gray-200 p-5 transition hover:border-indigo-300 hover:bg-indigo-50/30">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                <p className="mt-4 text-sm font-medium text-indigo-600">See the setup →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">How it works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">The organizer stops being the reminder system</h2>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {STEPS.map(([number, title, body]) => (
              <div key={number} className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
                <span className="text-sm font-bold text-indigo-600">{number}</span>
                <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">Why chat stalls</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Conversation is good at ideas. It is bad at closure.</h2>
          </div>
          <div className="space-y-5 text-gray-600">
            <p>Group chats blur together yes, no, maybe, silence, new options, and old options. The organizer ends up reconstructing the state of the decision by hand.</p>
            <p>Planit keeps the chat for conversation and moves the decision into one small place with a finite set of choices, a clean decline, targeted reminders, and an explicit result.</p>
            <Link href="/about" className="inline-block text-sm font-semibold text-indigo-600 hover:underline">What planit is for →</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">From the guides</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Practical group-planning advice</h2>
            </div>
            <Link href="/guides" className="text-sm font-semibold text-indigo-600 hover:underline">All guides →</Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {latest.map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-indigo-200">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{guide.topic}</p>
                <h3 className="mt-2 font-semibold leading-6 text-gray-900">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{guide.description}</p>
                <p className="mt-4 text-xs text-gray-400">{guide.minutes} min read</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Something you need the group to decide?</h2>
          <p className="mt-3 text-gray-600">Make the question concrete, send it once, and get out of the coordination loop.</p>
          <Link href="/polls/new" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-7 py-3 font-semibold text-white hover:bg-indigo-700">Start a poll →</Link>
        </div>
      </section>
    </main>
  )
}
