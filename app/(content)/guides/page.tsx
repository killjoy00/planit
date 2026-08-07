import type { Metadata } from "next"
import Link from "next/link"
import { formatDate, guidesByDate } from "@/lib/guides"

export const metadata: Metadata = {
  title: "Guides to group planning, scheduling, and decisions",
  description:
    "Practical, opinionated guides on organising groups: picking dates people can actually make, writing polls that get answered, choosing a voting method, and following up without nagging.",
  alternates: { canonical: "/guides" },
}

export default function GuidesIndexPage() {
  const all = guidesByDate()

  return (
    <main className="flex-1 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Guides</h1>
        <div className="article mt-6">
          <p>
            Organising anything for more than four people is a skill, and almost nobody is taught
            it. These are the things we keep learning the hard way while building planit: how to
            ask a question a group can actually answer, why a chat thread cannot close a decision,
            what a deadline needs in order to work, and how to chase people without becoming the
            person everyone mutes.
          </p>
          <p>
            Everything here is written to be used. No tool required for any of it &mdash; where
            planit does something described below, it is because we wrote the guide first and the
            feature second.
          </p>
        </div>

        <ul className="mt-10 space-y-8 border-t border-gray-200 pt-8">
          {all.map((guide) => (
            <li key={guide.slug}>
              <article>
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                  {guide.topic}
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-900">
                  <Link href={`/guides/${guide.slug}`} className="hover:text-indigo-600">
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-2 text-gray-600">{guide.excerpt}</p>
                <p className="mt-3 text-sm text-gray-400">
                  <time dateTime={guide.published}>{formatDate(guide.published)}</time> ·{" "}
                  {guide.minutes} min read
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
