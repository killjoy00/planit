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
  topic:
    | "Scheduling"
    | "Group decisions"
    | "Etiquette"
    | "Trips"
    | "Money"
    | "Events"
    | "Recurring groups"
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
  {
    slug: "splitting-the-bill",
    title: "Splitting the bill without anyone quietly resenting it",
    description:
      "Even split or itemized, who fronts the money, when to settle, and how to handle the person who orders the lobster. The mechanics of group money.",
    excerpt:
      "Money is the thing groups are worst at discussing and quickest to resent. Most of the damage comes from three decisions nobody makes out loud — how to split, who fronts, and when to settle.",
    published: "2026-08-22",
    minutes: 10,
    topic: "Money",
  },
  {
    slug: "group-size-changes-everything",
    title: "Why five, eight, and twelve are completely different problems",
    description:
      "Coordination cost does not rise with group size, it accelerates. What breaks at each threshold, and what to change when your group crosses one.",
    excerpt:
      "The methods that work beautifully for five people fall apart at twelve, and not gradually. Group size has thresholds, each with its own failure mode and its own fix.",
    published: "2026-08-22",
    minutes: 10,
    topic: "Group decisions",
  },
  {
    slug: "scheduling-across-time-zones",
    title: "Scheduling a group across time zones",
    description:
      "The fairness math, the notation that prevents disasters, and why the meeting nobody wants at 6am keeps getting scheduled at 6am.",
    excerpt:
      "Distributed groups do not have a scheduling problem, they have a fairness problem wearing a scheduling problem as a disguise. Here is how to run it so the same person is not always the one getting up early.",
    published: "2026-08-22",
    minutes: 9,
    topic: "Scheduling",
  },
  {
    slug: "breaking-a-deadlock",
    title: "What to do when the group genuinely cannot agree",
    description:
      "Five ways out of a stalemate — relaxing constraints, splitting the group, rotating the decider, and when a coin flip is the legitimate answer.",
    excerpt:
      "Sometimes the vote is tied, or every option is blocked by someone. Deadlock is not a failure of the group; it is a signal that the question is wrong. Five ways out, in the order to try them.",
    published: "2026-08-22",
    minutes: 9,
    topic: "Group decisions",
  },
  {
    slug: "planning-a-group-dinner",
    title: "How to plan a group dinner that actually happens",
    description:
      "Table size, reservations, dietary constraints, and price signaling — the specific things that sink restaurant plans for six or more.",
    excerpt:
      "Restaurant plans fail in ways that trips do not: the table you can book shapes the guest list, and the price nobody mentioned shapes who shows up.",
    published: "2026-08-22",
    minutes: 9,
    topic: "Events",
  },
  {
    slug: "keeping-a-recurring-group-alive",
    title: "How to keep a book club, game night, or supper club alive",
    description:
      "Recurring groups die from drift, not from conflict. Fixed cadence, an attendance floor, rotating ownership, and the honest exit.",
    excerpt:
      "Almost every recurring group dies the same way: one skipped month, then a rescheduled one, then a thread nobody answers. The fixes are structural and they are boring, which is why they work.",
    published: "2026-08-22",
    minutes: 10,
    topic: "Recurring groups",
  },
  {
    slug: "planning-someone-elses-birthday",
    title: "Organizing a birthday for someone who is not organizing it",
    description:
      "The guest list problem, surprise logistics, gift coordination, and how to plan around a person without them noticing or being left out.",
    excerpt:
      "Planning for someone else inverts every normal rule: you cannot ask the one person who knows the answers, and the guest list is a minefield you did not draw.",
    published: "2026-08-22",
    minutes: 9,
    topic: "Events",
  },
  {
    slug: "the-etiquette-of-dropping-out",
    title: "The etiquette of dropping out",
    description:
      "When cancelling is fine, how much notice you owe, what you owe financially, and how to say it in a way that costs the group nothing.",
    excerpt:
      "Everyone eventually has to pull out of something they said yes to. What separates a forgivable cancellation from a memorable one is almost entirely timing and phrasing.",
    published: "2026-08-22",
    minutes: 8,
    topic: "Etiquette",
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
