import type { MetadataRoute } from "next"
import { guides } from "@/lib/guides"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const newestGuide = guides
    .map((g) => g.updated ?? g.published)
    .sort()
    .at(-1)

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/demo`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: newestGuide,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...guides.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.updated ?? guide.published,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/faq`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ]
}
