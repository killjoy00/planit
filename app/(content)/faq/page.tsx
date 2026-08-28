import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "How planit works, what voters have to do, how reminders and deadlines behave, what happens to your data, and what the service costs.",
  alternates: { canonical: "/faq" },
}

interface Faq {
  q: string
  a: React.ReactNode
  /** Plain-text version for the structured-data block. */
  text: string
}

const FAQS: { section: string; items: Faq[] }[] = [
  {
    section: "Using planit",
    items: [
      {
        q: "Do the people I invite need an account?",
        a: (
          <p>
            No. Only the person creating a poll signs in, and that is a magic link rather than a
            password. Everyone invited votes from a private link in their email &mdash; no signup,
            no app, no password reset at eleven at night. That one detail is the difference between
            a poll that gets nine replies and one that gets four.
          </p>
        ),
        text:
          "No. Only the poll creator signs in, using a magic link rather than a password. Everyone invited votes from a private link in their email, with no signup and no app.",
      },
      {
        q: "How many options should a poll have?",
        a: (
          <p>
            Three to five. Two is usually a false binary that invites &ldquo;neither, what
            about&hellip;&rdquo;; six or more turns a fifteen-second reply into a research task and
            spreads the votes so thin that the winner looks arbitrary. If you genuinely have eight
            candidates, shortlist first and vote on the shortlist.{" "}
            <Link href="/guides/write-a-poll-people-answer">More on writing options</Link>.
          </p>
        ),
        text:
          "Three to five. Two options is usually a false binary; six or more spreads votes so thin that the winner looks arbitrary. Shortlist first if you have more candidates than that.",
      },
      {
        q: "Can people vote for more than one option?",
        a: (
          <p>
            Yes, and for scheduling you should let them. Ticking every date that works asks{" "}
            <em>which can you do</em> rather than <em>which do you prefer</em>, so the winner is the
            widest overlap rather than whichever option one bloc felt most strongly about. See{" "}
            <Link href="/guides/group-voting-methods">
              the comparison of voting methods
            </Link>{" "}
            for a worked example where this changes the result.
          </p>
        ),
        text:
          "Yes, and for scheduling you should. Ticking every workable option finds the widest overlap rather than the strongest single bloc.",
      },
      {
        q: "What happens when someone does not vote?",
        a: (
          <p>
            They are not counted as available for anything, and they do not block the decision. The
            poll closes on its deadline with the votes it has. Non-voters are still welcome to come
            to whatever the group picked &mdash; the point of the deadline is to stop one silence
            from holding up eight people.
          </p>
        ),
        text:
          "They are not counted as available for anything and they do not block the decision. The poll closes on its deadline with the votes it has.",
      },
      {
        q: "How do reminders work?",
        a: (
          <p>
            Up to three, escalating in directness, and then they stop. Anyone who has voted or
            opted out is dropped from the reminder list immediately. Reminders that repeat
            themselves forever are what make organizing feel like nagging, so the sequence is
            deliberately finite.{" "}
            <Link href="/guides/follow-up-without-nagging">
              How to write a follow-up that works
            </Link>
            .
          </p>
        ),
        text:
          "Up to three reminders, escalating in directness, then they stop. Anyone who has voted or opted out stops receiving them immediately.",
      },
      {
        q: "Can someone say no without explaining themselves?",
        a: (
          <p>
            Every invitation carries a one-tap way out. Opting out removes that person from
            reminders straight away and tells everyone else to stop waiting on them. A fast no is
            far more useful to a group than a slow maybe, so declining is treated as a real answer
            rather than a failure.
          </p>
        ),
        text:
          "Yes. Every invitation has a one-tap opt-out, which removes that person from reminders immediately and lets the rest of the group stop waiting.",
      },
      {
        q: "Do I have to rebuild the guest list every time?",
        a: (
          <p>
            No &mdash; groups persist. Add your people once and every poll after that is a two-step
            job: pick the group, send it. You can add participants to an open poll if you forgot
            someone, and their invitation goes out immediately. Or create without a guest list and
            share the public join link through text or group chat instead.
          </p>
        ),
        text:
          "No. Groups persist, so you add people once and reuse the group for every later poll. You can also create without invitees and share a public join link.",
      },
      {
        q: "What happens when a poll closes?",
        a: (
          <p>
            The winning option is announced to everyone who took part, and you can download a
            calendar file for it. If a poll reaches its deadline it closes automatically; you can
            also close one early once the answer is obvious. If the top options are tied, planit
            waits for the organizer to choose the winner before sending the announcement.
          </p>
        ),
        text:
          "The winning option is announced to everyone who took part and can be downloaded as a calendar file. If top options tie, the organizer chooses before the announcement is sent.",
      },
      {
        q: "Can voters see how everyone else voted?",
        a: (
          <p>
            Results show the standings once you have voted, so people can see how the group is
            leaning without that information shaping their own answer beforehand. The organizer sees
            who has and has not responded, which is what makes a targeted reminder possible.
          </p>
        ),
        text:
          "Standings are shown after you vote, so early answers do not anchor later ones. The organizer can see who has and has not responded.",
      },
    ],
  },
  {
    section: "Privacy, cost, and the small print",
    items: [
      {
        q: "What does planit cost?",
        a: (
          <p>
            Nothing. There is no paid tier and no credit card. Hosting and email are paid for by the
            ads shown alongside the guides on this site &mdash; which is also why you will not see
            an ad on a voting screen or anywhere inside the app.
          </p>
        ),
        text:
          "Nothing. There is no paid tier. Hosting and email costs are covered by advertising shown alongside the guides, never inside the app or on voting screens.",
      },
      {
        q: "Are there ads in the app or in the emails?",
        a: (
          <p>
            No. Advertising appears only on the published pages of this site &mdash; the guides, the
            FAQ, and the home page. The signed-in app, the invitation emails, and every voting and
            confirmation screen are ad-free.
          </p>
        ),
        text:
          "No. Ads appear only on the published pages of the site. The signed-in app, the emails, and all voting screens are ad-free.",
      },
      {
        q: "What do you do with my friends' email addresses?",
        a: (
          <p>
            They are used to send that poll&rsquo;s invitation, its reminders, and its result.
            Nothing else. They are not sold, not shared with advertisers, and not added to any
            mailing list. See the <Link href="/privacy">privacy policy</Link> for specifics.
          </p>
        ),
        text:
          "They are used to send the poll invitation, its reminders, and its result, and nothing else. They are not sold, shared with advertisers, or added to a mailing list.",
      },
      {
        q: "Is the voting link private?",
        a: (
          <p>
            Each participant gets their own unguessable link, which is how voting works without an
            account. Treat it like a personal link: anyone you forward it to could vote as you.
            Voting pages are excluded from search engines.
          </p>
        ),
        text:
          "Each participant gets their own unguessable link, which is what allows voting without an account. Anyone you forward it to could vote as you. Voting pages are excluded from search engines.",
      },
      {
        q: "Can I delete a group or have my data removed?",
        a: (
          <p>
            You can delete a group from inside the app, which removes its saved participant list.
            To have an account, or your name and email as a participant, removed entirely, email{" "}
            <a href="mailto:privacy@planitnow.us">privacy@planitnow.us</a> from that address. Mail
            that has already been delivered obviously still sits in people&rsquo;s inboxes. The{" "}
            <Link href="/privacy">privacy policy</Link> has the details.
          </p>
        ),
        text:
          "You can delete a group from inside the app, which removes its saved participant list. To have an account or your details as a participant removed entirely, email privacy@planitnow.us from that address.",
      },
    ],
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.text },
    })),
  ),
}

export default function FaqPage() {
  return (
    <main className="flex-1 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          How planit behaves, what it asks of the people you invite, and what happens to the data
          involved.
        </p>

        {FAQS.map((group) => (
          <section key={group.section} className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              {group.section}
            </h2>
            <dl className="mt-6 space-y-8">
              {group.items.map((item) => (
                <div key={item.q}>
                  <dt className="text-lg font-semibold text-gray-900">{item.q}</dt>
                  <dd className="article mt-2">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <div className="mt-12 border-t border-gray-200 pt-8 text-gray-600">
          <p>
            Still stuck? The <Link href="/guides" className="text-indigo-600 hover:underline">guides</Link>{" "}
            go deeper on the planning problems behind most of these questions.
          </p>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
