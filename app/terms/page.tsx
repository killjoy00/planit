import type { Metadata } from "next"
import Link from "next/link"
import { Prose, Section } from "@/components/ui/Prose"

export const metadata: Metadata = {
  title: "Terms of Service — planit",
  description: "The terms you agree to when using planit.",
}

const CONTACT = "support@planitnow.us"

export default function TermsPage() {
  return (
    <Prose title="Terms of Service" updated="July 25, 2026">
      <p>
        These terms cover your use of planit. By creating a poll or casting a vote, you
        agree to them. If you do not agree, please don&apos;t use the service.
      </p>

      <Section heading="What planit is">
        <p>
          planit is a free tool for running group polls by email. You can create polls and
          invite people to vote; people you invite can vote without creating an account.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          Signing in works through a one-time link sent to your email address, so the
          security of your account depends on the security of your inbox. Anyone with
          access to your email can sign in as you.
        </p>
        <p>
          The same applies to voting links: each is unique and secret, and anyone holding
          one can vote in your name. Please don&apos;t forward them.
        </p>
      </Section>

      <Section heading="Inviting other people">
        <p>
          When you add someone to a poll or a group, you are giving us their name and
          email address and asking us to email them on your behalf. You confirm that you
          have a genuine personal or professional relationship with the people you add,
          and that they would reasonably expect to hear from you about this.
        </p>
        <p>
          Do not use planit to send bulk or unsolicited email, to import purchased or
          scraped contact lists, or to contact people who have asked you to stop. This is
          the one rule we will suspend an account over without warning.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>You agree not to use planit to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>harass, threaten, defame, or impersonate anyone</li>
          <li>post unlawful content, or content you have no right to share</li>
          <li>attempt to access polls, votes, or accounts that aren&apos;t yours</li>
          <li>probe, overload, or disrupt the service or its infrastructure</li>
          <li>scrape or bulk-collect data through automated means</li>
        </ul>
        <p>
          You are responsible for the content you put into a poll. We may remove content
          or suspend access for violations of these terms.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          planit is provided free and without any guarantee of uptime. We may change,
          suspend, or discontinue any part of it, and we may delete inactive data. Please
          don&apos;t rely on planit as the only record of anything you would be upset to
          lose.
        </p>
      </Section>

      <Section heading="Advertising">
        <p>
          The service displays third-party advertising, which is what keeps it free. We
          don&apos;t control and aren&apos;t responsible for the content of ads or the
          sites they lead to.
        </p>
      </Section>

      <Section heading="Disclaimer and liability">
        <p>
          planit is provided &quot;as is&quot; and &quot;as available&quot;, without
          warranties of any kind, whether express or implied, including fitness for a
          particular purpose and non-infringement.
        </p>
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect,
          incidental, or consequential damages, or for any lost data, missed plans, or
          missed events arising from your use of the service.
        </p>
      </Section>

      <Section heading="Ending your use">
        <p>
          You can stop using planit at any time. To have your data deleted, see the{" "}
          <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>.
          We may suspend or terminate access if these terms are broken.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms. When we do, the date at the top of this page changes,
          and continuing to use planit means you accept the update.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms:{" "}
          <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline">{CONTACT}</a>.
        </p>
      </Section>
    </Prose>
  )
}
