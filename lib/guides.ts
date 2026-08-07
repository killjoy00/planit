/**
 * Registry for the published guides. The article bodies live in their own
 * route files under `app/(content)/guides/<slug>/page.tsx`; this holds the
 * metadata those pages, the index, and the sitemap all share.
 */
export interface Guide {
  slug: string
  title: string
  /** Meta description and social summary. */
  description: string
  /** Longer blurb used on the index page. */
  excerpt: string
  /** ISO date, used for the sitemap and the byline. */
  published: string
  updated?: string
  minutes: number
  topic: "Scheduling" | "Group decisions" | "Etiquette" | "Trips"
}

export const guides: Guide[] = [
  {
    slug: "pick-a-date-everyone-can-make",
    title: "How to pick a date everyone can actually make",
    description:
      "Why open-ended date questions stall, how many options to offer, and how to close a group scheduling decision in two days instead of two weeks.",
    excerpt:
      "The date question is where most plans die. Here is why asking \"when are you free?\" backfires, how many options to put in front of people, and how to close the decision before the enthusiasm drains out of it.",
    published: "2026-06-15",
    minutes: 8,
    topic: "Scheduling",
  },
  {
    slug: "group-chat-decision-paralysis",
    title: "Why group chats are terrible at making decisions",
    description:
      "Group chats are built for conversation, not for closure. A look at the specific failure modes — and the small structural changes that fix them.",
    excerpt:
      "Everyone has watched a plan drown in a group chat. The problem is not that your friends are flaky; it is that a chat thread has no ballot, no deadline, and no way to tell a silence from a no.",
    published: "2026-06-23",
    minutes: 9,
    topic: "Group decisions",
  },
  {
    slug: "write-a-poll-people-answer",
    title: "How to write a poll people actually answer",
    description:
      "Option count, wording, deadlines, and subject lines: the practical mechanics that move a group poll from a 40% response rate to a 90% one.",
    excerpt:
      "A poll nobody answers is worse than no poll — it burns a week and teaches the group that your invitations can be ignored. The fixes are mostly mechanical.",
    published: "2026-07-02",
    minutes: 9,
    topic: "Group decisions",
  },
  {
    slug: "group-voting-methods",
    title: "Plurality, approval, or ranked: picking a voting method for your group",
    description:
      "The same ballots can produce three different winners depending on how you count them. A plain-language comparison of the methods small groups actually use.",
    excerpt:
      "Eight friends, four restaurants, one evening. Depending on how you count the votes, three different restaurants can legitimately win. Here is what each counting method rewards, and when to use it.",
    published: "2026-07-13",
    minutes: 11,
    topic: "Group decisions",
  },
  {
    slug: "follow-up-without-nagging",
    title: "How to follow up without nagging",
    description:
      "A reminder cadence that respects people: when to nudge, what to say, when to escalate, and the point at which you should stop and decide without them.",
    excerpt:
      "Chasing responses feels like nagging because most follow-ups are written badly — no new information, no deadline, no exit. A better cadence gets answers and costs you nothing socially.",
    published: "2026-07-24",
    minutes: 8,
    topic: "Etiquette",
  },
  {
    slug: "group-trip-planning-timeline",
    title: "A realistic timeline for planning a group trip",
    description:
      "Working backwards from the trip: when to lock dates, when to talk money, when to book, and the deadlines that keep a six-person trip from collapsing.",
    excerpt:
      "Group trips fail on sequencing, not enthusiasm. Dates before destination, money before booking, deposits before the group grows. Here is the order that works, counted backwards from departure.",
    published: "2026-08-04",
    minutes: 12,
    topic: "Trips",
  },
]

const bySlug = new Map(guides.map((g) => [g.slug, g]))

export function getGuide(slug: string): Guide {
  const guide = bySlug.get(slug)
  if (!guide) throw new Error(`Unknown guide: ${slug}`)
  return guide
}

/** Newest first — the order the index page renders. */
export function guidesByDate(): Guide[] {
  return [...guides].sort((a, b) => b.published.localeCompare(a.published))
}

/** Up to `count` other guides, preferring ones on the same topic. */
export function relatedGuides(slug: string, count = 3): Guide[] {
  const current = getGuide(slug)
  const others = guides.filter((g) => g.slug !== slug)
  const sameTopic = others.filter((g) => g.topic === current.topic)
  const rest = others.filter((g) => g.topic !== current.topic)
  return [...sameTopic, ...rest].slice(0, count)
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}
