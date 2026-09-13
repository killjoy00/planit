import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getUseCase, useCases } from "@/lib/use-cases"

export const dynamicParams = false

export function generateStaticParams() {
  return useCases.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = getUseCase(slug)
  if (!item) return {}

  return {
    title: item.title,
    description: item.description,
    alternates: { canonical: `/for/${item.slug}` },
    openGraph: {
      title: item.title,
      description: item.description,
      type: "website",
    },
  }
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getUseCase(slug)
  if (!item) notFound()

  const related = useCases.filter((candidate) => candidate.slug !== item.slug).slice(0, 3)
  const startHref = `/polls/new?preset=${item.slug}`

  return (
    <main className="flex-1">
      <section className="border-b border-gray-200 bg-stone-50 px-4 py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">{item.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              {item.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">{item.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={startHref}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                {item.cta} →
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:border-gray-400"
              >
                See the voter view
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">Free to start · voters need no account · reminders included</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Example poll">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Example setup</p>
                <p className="mt-1 text-sm font-medium text-gray-500">{item.starterLabel}</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">planit</span>
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-900">{item.sampleQuestion}</h2>
            <div className="mt-4 space-y-2.5">
              {item.sampleChoices.map((choice) => (
                <div key={choice} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <span className="h-4 w-4 rounded border-2 border-gray-300" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-700">{choice}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              You choose the options. Each participant gets one private place to answer, and the organizer sees the group together.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">Why this works better</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Less coordination, more decision</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {item.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">The whole flow</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Three steps, then you are done</h2>
              <Link href={item.guide.href} className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:underline">
                {item.guide.label} →
              </Link>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["1", "Add the real choices", "Start from the few dates or options that are actually possible."],
                ["2", "Send one link", "Invite by email or share the secure join link in the chat you already use."],
                ["3", "Close the decision", "Remind the people who have not answered, choose the result, and move on."],
              ].map(([number, title, body]) => (
                <li key={number} className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
                  <span className="text-sm font-bold text-indigo-600">{number}</span>
                  <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">Other ways to use planit</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Start with the job, not the settings</h2>
            </div>
            <Link href={startHref} className="text-sm font-semibold text-indigo-600 hover:underline">{item.cta} →</Link>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {related.map((candidate) => (
              <Link key={candidate.slug} href={`/for/${candidate.slug}`} className="rounded-xl border border-gray-200 p-5 transition hover:border-indigo-300 hover:bg-indigo-50/30">
                <p className="font-semibold text-gray-900">{candidate.name}</p>
                <p className="mt-1 text-sm leading-5 text-gray-500">{candidate.description}</p>
                <p className="mt-4 text-sm font-medium text-indigo-600">See the setup →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
