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
    <Prose title="Privacy Policy" updated="September 14, 2026">
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
          <strong className="text-gray-900">If you are invited by email:</strong> your
          name and email address, along with your vote. The organizer normally provides
          the name and address when creating or updating the poll.
        </p>
        <p>
          <strong className="text-gray-900">If you use a shared Fast Join link:</strong> the
          name you enter and your vote. An email address is not required. You may choose the
          verified-email option instead if you want a personal link, reminders, and the final
          result delivered to your inbox.
        </p>
        <p>
          <strong className="text-gray-900">Poll content:</strong> titles, descriptions,
          options, dates, deadlines, final plan details, and the groups and member lists that poll creators
          build.
        </p>
        <p>
          <strong className="text-gray-900">Acquisition attribution:</strong> if you arrive with
          campaign parameters such as a source or campaign name, or enter through one of our use-case
          pages, we may keep normalized source, campaign, and use-case labels so we can understand which
          entry points lead to an actual poll. We do not store the raw referrer URL or an IP address for
          acquisition analytics.
        </p>
        <p>
          <strong className="text-gray-900">Abuse-protection records:</strong> for public
          sign-in, verified-email join, and Fast Join requests, we temporarily record a timestamp
          and, when available, the source IP address and public-link scope involved. When the request
          asks us to send email, we also record the recipient address and kind of message. These
          records exist only to enforce short rate limits and prevent public forms from being abused.
          They are automatically pruned after two days.
        </p>
        <p>
          We do not collect payment details, and we do not use third-party analytics or behavioral
          tracking software. We use only the limited first-party acquisition attribution described
          above. As with any hosted web service, our infrastructure providers may process ordinary
          request and security logs as part of operating the service.
        </p>
      </Section>

      <Section heading="How we use it">
        <p>
          Email addresses are used only for messages the product needs to deliver: creator sign-in
          links; poll invitations and reminders; verified-email join confirmation; and final results.
          Name-only Fast Join voters are not emailed. We do not send marketing email and we do not
          sell or rent email addresses to anyone.
        </p>
        <p>
          Acquisition labels are used only to compare product entry points with first-poll activation,
          participant voting, successful closes, and repeat use. They are not used to personalize the
          product, build advertising profiles, or identify a person&apos;s browsing history.
        </p>
        <p>
          Every email invitation and reminder contains a one-click opt-out link. Using it stops
          all further email for that poll immediately. Fast Join ballots also provide an in-product
          way to opt out of the poll.
        </p>
        <p>
          The short-lived abuse-protection records described above are used only to enforce
          sending and join limits and investigate delivery or abuse problems; they are not used to build
          profiles, personalize the product, or target advertising.
        </p>
      </Section>

      <Section heading="Who can see your votes">
        <p>
          The person who created a poll can see participant names, who has voted, and which
          option each person chose. If you joined or were invited with email, the organizer can
          also see that address. Other participants see vote totals. Treat a vote as visible to
          the poll&apos;s creator rather than anonymous.
        </p>
        <p>
          The public join link is meant to be shared with the group and creates a separate ballot
          for each person who joins. Personal ballot links are unique and secret; anyone holding
          one can vote as that participant, so please do not forward personal ballot links.
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
          planit uses essential product cookies in two places. A session cookie is set when you
          sign in as a poll creator and keeps you signed in. If you use Fast Join, a separate
          first-party cookie remembers the ballot created in that browser so returning to the same
          shared poll does not create another participant. Opening a personal voting link from email
          does not require a creator account session.
        </p>
        <p>
          If a page contains a campaign source, campaign name, or use-case signal, planit may also set
          a first-party acquisition cookie for up to 30 days. It contains only normalized source,
          campaign, and use-case labels and exists so a later sign-in and first poll can be attributed
          to the entry point that led there. It does not contain a raw referrer URL or IP address.
        </p>
        <p>
          Advertising cookies are separate. We use Google AdSense to display ads, and only
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
          Polls, votes, participant records, group member lists, and saved acquisition labels are kept
          until they are deleted. A poll creator can delete their groups from within the app. Rate-limit
          records used to protect public forms are automatically deleted after two days. The temporary
          acquisition cookie expires after no more than 30 days.
        </p>
        <p>
          To have your account or participant record removed entirely, email{" "}
          <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline">{CONTACT}</a>.
          If the record is tied to an email address, contact us from that address when possible.
          For a name-only Fast Join record, include enough context about the poll for us to identify
          it. Depending on where you live you may also have the right to request a copy of your data,
          or to object to how it is processed — the same address covers those requests.
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
