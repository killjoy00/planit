import type { MetadataRoute } from "next"
import { CRAWL_DISALLOW, SITE_URL } from "@/lib/site"

/**
 * The published pages are the indexable surface. The app and the sign-in
 * screen stay crawlable but carry `noindex` in their layout metadata; only the
 * API and the private voting links are blocked outright.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: CRAWL_DISALLOW,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
