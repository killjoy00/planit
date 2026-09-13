export type StarterPollType = "DATE_POLL" | "TIME_POLL" | "SINGLE_CHOICE" | "YES_NO_VETO"

export interface PlanningUseCase {
  slug: string
  name: string
  eyebrow: string
  title: string
  description: string
  cta: string
  formTitle: string
  formIntro: string
  starterType: StarterPollType
  starterLabel: string
  sampleQuestion: string
  sampleChoices: string[]
  benefits: { title: string; body: string }[]
  guide: { href: string; label: string }
}

export const useCases: PlanningUseCase[] = [
  {
    slug: "group-dinner",
    name: "Group dinner",
    eyebrow: "Plan a group dinner",
    title: "Get a dinner date without restarting the group chat",
    description:
      "Put a few dates in one place, let everyone mark what works, and stop chasing replies one person at a time.",
    cta: "Start a dinner poll",
    formTitle: "Plan your group dinner",
    formIntro: "Start with a date poll, add the nights that could work, then send one link to the group.",
    starterType: "DATE_POLL",
    starterLabel: "Find a date",
    sampleQuestion: "When should we get dinner?",
    sampleChoices: ["Thursday, Oct 8", "Friday, Oct 9", "Saturday, Oct 10"],
    benefits: [
      { title: "Availability first", body: "Find the night people can actually make before debating restaurants or reservations." },
      { title: "One place to answer", body: "No scrolling back through twenty messages to figure out who said yes to which date." },
      { title: "A real finish", body: "Set a deadline, let reminders handle the holdouts, and close on a decision." },
    ],
    guide: { href: "/guides/planning-a-group-dinner", label: "Read the group dinner guide" },
  },
  {
    slug: "game-night",
    name: "Game night",
    eyebrow: "Schedule game night",
    title: "Pick game night before the thread turns into archaeology",
    description:
      "Offer the dates that work for the host, collect everyone else's availability, and get to the actual games faster.",
    cta: "Start a game-night poll",
    formTitle: "Schedule game night",
    formIntro: "Start with a date poll and add the nights the host can do. Everyone else marks what works.",
    starterType: "DATE_POLL",
    starterLabel: "Find a date",
    sampleQuestion: "When should we do game night?",
    sampleChoices: ["Tuesday night", "Thursday night", "Sunday afternoon"],
    benefits: [
      { title: "Host constraints first", body: "Only offer nights that are genuinely possible instead of negotiating every calendar from scratch." },
      { title: "Quiet no's count", body: "People can decline cleanly instead of leaving the organizer to interpret silence." },
      { title: "Reuse the group", body: "Save the regulars once so the next game night starts with the people already there." },
    ],
    guide: { href: "/guides/keeping-a-recurring-group-alive", label: "Read the recurring-group guide" },
  },
  {
    slug: "weekend-trip",
    name: "Weekend trip",
    eyebrow: "Plan a group trip",
    title: "Find the weekend before anyone books the wrong one",
    description:
      "Compare a few realistic windows, see where the whole group overlaps, and make the date decision before lodging and flights complicate it.",
    cta: "Start a trip poll",
    formTitle: "Find a weekend for the trip",
    formIntro: "Start with a date poll. For multi-day options, use the optional “Through” date to show the full weekend.",
    starterType: "DATE_POLL",
    starterLabel: "Find a date",
    sampleQuestion: "Which weekend works for the trip?",
    sampleChoices: ["Oct 16–18", "Oct 23–25", "Nov 6–8"],
    benefits: [
      { title: "Compare real windows", body: "Put the actual candidate weekends side by side instead of collecting vague “October works” replies." },
      { title: "See the overlap", body: "Everyone marks every option they can make, so the shared window becomes obvious." },
      { title: "Book after agreement", body: "Close the date first, then move on to lodging, travel, and the rest of the trip." },
    ],
    guide: { href: "/guides/group-trip-planning-timeline", label: "Read the group trip timeline" },
  },
  {
    slug: "book-club",
    name: "Book club",
    eyebrow: "Schedule book club",
    title: "Keep book club moving without making one person chase everyone",
    description:
      "Pick the next meeting, remind only the people who have not answered, and reuse the same group next month.",
    cta: "Start a book-club poll",
    formTitle: "Schedule the next book-club meeting",
    formIntro: "Start with a date poll now. Once the group is settled, recurring series can make the next round even easier.",
    starterType: "DATE_POLL",
    starterLabel: "Find a date",
    sampleQuestion: "When should we meet for book club?",
    sampleChoices: ["Wednesday evening", "Thursday evening", "Sunday afternoon"],
    benefits: [
      { title: "The same group stays saved", body: "Stop rebuilding the member list every time someone finishes the book." },
      { title: "Reminders are targeted", body: "Only the people who still owe an answer get nudged." },
      { title: "Recurring is available", body: "Once the cadence is working, a series can carry the pattern forward." },
    ],
    guide: { href: "/guides/keeping-a-recurring-group-alive", label: "Read the recurring-group guide" },
  },
  {
    slug: "family-gathering",
    name: "Family gathering",
    eyebrow: "Schedule a family gathering",
    title: "Find the family date without appointing a full-time coordinator",
    description:
      "Give everyone the same set of choices, collect availability in one place, and stop relaying answers between separate text threads.",
    cta: "Start a family poll",
    formTitle: "Schedule the family gathering",
    formIntro: "Start with a date poll and add the realistic choices. Invite by email or share the join link yourself.",
    starterType: "DATE_POLL",
    starterLabel: "Find a date",
    sampleQuestion: "When can everyone get together?",
    sampleChoices: ["Saturday lunch", "Sunday lunch", "Next Saturday dinner"],
    benefits: [
      { title: "One source of truth", body: "Everyone answers the same question instead of feeding availability through different relatives." },
      { title: "No voter account", body: "People can vote from their private link without creating a planit account." },
      { title: "Works for bigger groups", body: "The organizer sees responses together instead of mentally reconciling a dozen conversations." },
    ],
    guide: { href: "/guides/group-size-changes-everything", label: "Read the guide to larger groups" },
  },
  {
    slug: "group-decision",
    name: "Group decision",
    eyebrow: "Make a group decision",
    title: "Choose between real options instead of debating forever",
    description:
      "Restaurant, destination, activity, draft rule, movie: put the actual choices in front of the group and get a decision you can use.",
    cta: "Start a decision poll",
    formTitle: "Make the group decision",
    formIntro: "Start with “Choose between options,” add the real choices, and let the group vote from one link.",
    starterType: "SINGLE_CHOICE",
    starterLabel: "Choose between options",
    sampleQuestion: "What should we choose?",
    sampleChoices: ["Option A", "Option B", "Option C"],
    benefits: [
      { title: "Concrete choices", body: "A finite list is easier to answer than another open-ended “what does everyone want?” message." },
      { title: "Suggestions are optional", body: "Open the list to participant ideas when that helps, or keep the ballot fixed when it does not." },
      { title: "Decision, then move on", body: "Close the poll, share the winner, and keep the planning process from becoming the activity itself." },
    ],
    guide: { href: "/guides/group-voting-methods", label: "Read the group voting guide" },
  },
]

export function getUseCase(slug: string | undefined): PlanningUseCase | undefined {
  return slug ? useCases.find((item) => item.slug === slug) : undefined
}
