import type { Metadata } from "next"
import { Prose, Section } from "@/components/ui/Prose"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What planit collects, why, who it is shared with, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
}

const CONTACT = "privacy@planitnow.us"

export default function PrivacyPage() {
  return (
    <Prose title="Privacy Policy" updated="July 25, 2026">
      <p>
        This policy explains what planit (&quot;we&quot;, &quot;the service&quot;) collects,
        why, and what happens to it. planit is operated as an independent project and is
        reachable at{" "}
        <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline">{CONTACT}</a>.
      </p>

      <Section heading="What we collect">
        <p>
          <strong className="text-gray-900">If you create polls:</strong> your email
          address, which you give us when you sign in. Sign-in works by emailing you a
          one-time link, so we never ask for or store a password.
        </p>
        <p>
          <strong className="text-gray-900">If you were invited to vote:</strong> your
          name and email address, along with your vote. Please note that this information
          was provided by the person who created the poll, not collected from you
          directly.
        </p>
        <p>
          <strong className="text-gray-900">Poll content:</strong> titles, descriptions,
          options, dates, deadlines, and the groups and member lists that poll creators
          build.
        </p>
        <p>
          We do not collect payment details, and we do not run analytics or tracking
          software of our own.
        </p>
      </Section>

      <Section heading="How we use it">
        <p>
          Email addresses are used to send exactly three kinds of message: your sign-in
          link, invitations and reminders for polls you were invited to, and the result
          when a poll closes. We do not send marketing email and we do not sell or rent
          email addresses to anyone.
        </p>
        <p>
          Every invitation and reminder contains a one-click opt-out link. Using it stops
          all further email for that poll immediately.
        </p>
      </Section>

      <Section heading="Who can see your votes">
        <p>
          The person who created a poll can see who was invited, who has voted, and which
          option each person chose. Other participants see vote totals. Treat a vote as
          visible to the poll&apos;s creator rather than anonymous.
        </p>
        <p>
          Voting links are unique and secret. Anyone holding one can vote as you, so
          please do not forward them.
        </p>
      </Section>

      <Section heading="Service providers">
        <p>
          We rely on a few third parties to run the service. Each processes data only to
          provide their part of it:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-gray-900">Vercel</strong> — website hosting</li>
          <li><strong className="text-gray-900">Neon</strong> — database hosting</li>
          <li><strong className="text-gray-900">Resend</strong> — email delivery</li>
          <li><strong className="text-gray-900">Google AdSense</strong> — advertising</li>
        </ul>
      </Section>

      <Section heading="Advertising and cookies">
        <p>
          planit uses two kinds of cookie. The first is a session cookie, set only when
          you sign in as a poll creator, which keeps you signed in. It is essential to the
          service. Voting by email sets no such cookie.
        </p>
        <p>
          The second comes from advertising. We use Google AdSense to display ads, and only
          on our published pages — the home page, the guides, the FAQ, and this site&apos;s
          other articles. No ads are shown inside the signed-in app, on voting or
          confirmation screens, or in any email we send, so the AdSense script does not load
          at all on those pages.
        </p>
        <p>
          Where ads are shown, third-party vendors including Google use cookies to serve ads
          based on your prior visits to this and other websites. Google&apos;s use of
          advertising cookies enables it and its partners to serve ads to you based on your
          visits to our site and other sites on the internet.
        </p>
        <p>
          You can opt out of personalised advertising in{" "}
          <a
            href="https://www.google.com/settings/ads"
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          , or opt out of third-party vendors&apos; use of cookies for personalised
          advertising at{" "}
          <a
            href="https://www.aboutads.info/choices/"
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboutads.info
          </a>
          .
        </p>
      </Section>

      <Section heading="Retention and deletion">
        <p>
          Polls, votes, and group member lists are kept until they are deleted. A poll
          creator can delete their groups from within the app.
        </p>
        <p>
          To have your account, or your name and email as a participant, removed entirely,
          email{" "}
          <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline">{CONTACT}</a>{" "}
          from the address in question and we will delete it. Depending on where you live
          you may also have the right to request a copy of your data, or to object to how
          it is processed — the same address covers those requests.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          planit is not directed at children under 13 and we do not knowingly collect
          their information. If you believe a child has been added to a poll, contact us
          and we will remove the record.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If this policy changes materially, the date at the top of this page will be
          updated. Continuing to use planit after a change means you accept the revised
          policy.
        </p>
      </Section>
    </Prose>
  )
}
