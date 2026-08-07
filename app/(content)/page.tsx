import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { guidesByDate } from "@/lib/guides"

export const metadata: Metadata = {
  title: "planit — group polls people actually answer",
  description:
    "Free group polls for picking dates, places, and plans. Your friends vote straight from their email — no account, no app, no endless group chat.",
  alternates: { canonical: "/" },
}

const STEPS = [
  {
    n: "1",
    title: "Save the group once",
    body: "Add the eight people you always invite. Every poll after that starts from the group instead of from a blank list of email addresses.",
  },
  {
    n: "2",
    title: "Ask one question, with a deadline",
    body: "Three to five concrete options and a closing time. Everyone gets their own private link and ticks every option that works for them.",
  },
  {
    n: "3",
    title: "It closes itself",
    body: "Up to three escalating reminders go to the people who haven't answered, then the poll closes on schedule and everyone gets the result.",
  },
]

const USES = [
  ["Dinner on a weeknight", "Four dates, one question, closes Thursday."],
  ["A weekend away", "Find the window six people can all make before anyone books anything."],
  ["A recurring club night", "Same group every month; a new poll takes about twenty seconds."],
  ["A birthday nobody has organised yet", "Including the part where you find out who is actually coming."],
]

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  const latest = guidesByDate().slice(0, 3)

  return (
    <main className="flex-1">
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Group polls people actually answer
          </h1>
          <p className="mt-5 text-xl text-gray-600">
            Stop re-adding everyone. Stop chasing responses. Pick a date or a plan, send it once,
            and let it close itself &mdash; your friends vote from their inbox, no account needed.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Start planning →
          </Link>
          <p className="mt-3 text-sm text-gray-400">Free. No credit card.</p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                  {step.n}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Why plans stall, and what changes here
          </h2>
          <div className="article mt-6">
            <p>
              Group plans rarely fail because people do not want to come. They fail because a chat
              thread cannot tell a <em>no</em> from a <em>not yet</em>, the list of options keeps
              moving, and nothing in the medium ever announces that a decision has been made. So
              the plan idles until whoever cares most books something unilaterally, and that person
              slowly stops volunteering.
            </p>
            <p>Three design decisions do most of the work of fixing that:</p>
            <ul>
              <li>
                <strong>Groups persist.</strong> The reason people stop organising is not the
                deciding, it is the admin. Rebuilding the same list of eight email addresses every
                time is enough friction to kill a monthly thing.
              </li>
              <li>
                <strong>Reminders escalate, then stop.</strong> Three nudges that get progressively
                more direct, aimed only at the people who have not answered, and then the group
                moves on. Chasing is only tolerable when it visibly ends.
              </li>
              <li>
                <strong>&ldquo;I&rsquo;m out&rdquo; is a first-class answer.</strong> Most silence
                is someone who has decided against and cannot find a graceful way to say so. One tap
                to decline turns a week of ambiguity into an immediate, useful answer.
              </li>
            </ul>
            <p>
              We write up what we learn about this in the{" "}
              <Link href="/guides">guides</Link> &mdash; on picking dates, writing polls, counting
              votes, and following up without becoming the person everyone mutes.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">What people use it for</h2>
          <dl className="mt-6 space-y-4">
            {USES.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-gray-200 p-5">
                <dt className="font-semibold text-gray-900">{title}</dt>
                <dd className="mt-1 text-gray-600">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">From the guides</h2>
            <Link href="/guides" className="text-sm font-medium text-indigo-600 hover:underline">
              All guides →
            </Link>
          </div>
          <ul className="mt-6 space-y-6">
            {latest.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guides/${guide.slug}`} className="group block">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                    {guide.title}
                  </h3>
                  <p className="mt-1 text-gray-600">{guide.description}</p>
                  <p className="mt-1 text-sm text-gray-400">{guide.minutes} min read</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Something you need to decide?
          </h2>
          <p className="mt-3 text-gray-600">
            Signing in takes one email and no password. Everyone you invite needs neither.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Start a poll →
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Questions first? Read the <Link href="/faq" className="text-indigo-600 hover:underline">FAQ</Link>{" "}
            or <Link href="/about" className="text-indigo-600 hover:underline">what planit is for</Link>.
          </p>
        </div>
      </section>
    </main>
  )
}
