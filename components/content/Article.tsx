import Link from "next/link"
import type { Metadata } from "next"
import { ArticleAd } from "@/components/ads/AdSense"
import { formatDate, getGuide, relatedGuides, type Guide } from "@/lib/guides"
import { SITE_URL } from "@/lib/site"

/** Shared `metadata` export builder for a guide route. */
export function guideMetadata(slug: string): Metadata {
  const guide = getGuide(slug)
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}/guides/${guide.slug}`,
      publishedTime: guide.published,
      modifiedTime: guide.updated ?? guide.published,
    },
  }
}

/**
 * Shell for a published guide: heading, byline, prose body, one in-article ad
 * unit below the text, and links onward to related reading.
 */
export function Article({ slug, children }: { slug: string; children: React.ReactNode }) {
  const guide = getGuide(slug)
  const related = relatedGuides(slug)

  return (
    <main className="flex-1 px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <nav className="text-sm text-gray-500">
          <Link href="/guides" className="hover:text-indigo-600">
            ← All guides
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
            {guide.topic}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-gray-600">{guide.description}</p>
          <p className="mt-4 text-sm text-gray-400">
            <time dateTime={guide.updated ?? guide.published}>
              {formatDate(guide.updated ?? guide.published)}
            </time>
            {guide.updated ? " (updated)" : ""} · {guide.minutes} min read
          </p>
        </header>

        <hr className="mt-8 border-gray-200" />

        <div className="article mt-8">{children}</div>

        <ArticleAd />

        <RelatedGuides guides={related} />

        <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
          <p className="font-semibold text-gray-900">Running one of these decisions yourself?</p>
          <p className="mt-1 text-gray-600">
            planit sends the poll, chases the stragglers, and closes on a deadline. Your friends
            vote from their inbox — no account required.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Start a poll →
          </Link>
        </div>
      </article>
    </main>
  )
}

function RelatedGuides({ guides }: { guides: Guide[] }) {
  if (guides.length === 0) return null

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
        Keep reading
      </h2>
      <ul className="mt-4 space-y-4">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="group block">
              <span className="font-medium text-gray-900 group-hover:text-indigo-600">
                {g.title}
              </span>
              <span className="mt-0.5 block text-sm text-gray-500">{g.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
