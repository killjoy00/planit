/** Canonical origin, used for metadata, sitemap, and robots. */
export const SITE_URL = "https://planitnow.us"

export const SITE_NAME = "planit"

/**
 * Paths crawlers should not fetch at all: the API, and the per-participant
 * voting links, which are private URLs with nothing to index.
 *
 * The rest of the product — /login, /dashboard, /groups, /polls — is left
 * crawlable on purpose and marked `noindex` in its layout metadata instead. A
 * page blocked in robots.txt can never be read, so its noindex is never seen,
 * and Google can keep showing a bare URL for it.
 */
export const CRAWL_DISALLOW = ["/api/", "/vote/"]

/**
 * Origin for links that leave the app — vote links, unsubscribe endpoints, the
 * share link a creator copies into a group chat.
 *
 * This was inlined at eight call sites, and one of them fell back to `""`
 * instead of the dev origin, so the share link on the poll page came out as a
 * bare path — fine in the page, useless once pasted anywhere else.
 */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
