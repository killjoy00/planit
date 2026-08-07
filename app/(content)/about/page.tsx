import type { Metadata } from "next"
import Link from "next/link"
import { Prose, Section } from "@/components/ui/Prose"

export const metadata: Metadata = {
  title: "About",
  description: "Why planit exists, how group voting by email works, and who builds it.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <Prose title="About planit">
      <p>
        planit is a small tool for deciding things as a group — where to eat, which
        weekend works for the trip, whether the whole plan is even happening.
      </p>

      <Section heading="The problem">
        <p>
          Most group-planning tools die for the same three reasons. Re-adding the same
          eight people every single time is tedious enough that you stop bothering.
          Half the group never responds, and chasing them feels like nagging. And when
          someone genuinely can&apos;t make it, there&apos;s no graceful way to say so —
          so they go quiet instead, and the plan stalls waiting on a &quot;no&quot; that
          never arrives.
        </p>
      </Section>

      <Section heading="How planit handles it">
        <p>
          <strong className="text-gray-900">Groups persist.</strong> Add your people
          once. Every poll after that is a two-tap job — pick the group, send it.
        </p>
        <p>
          <strong className="text-gray-900">Reminders escalate, then stop.</strong> Up
          to three nudges that get progressively more direct, and then the group moves
          forward without the stragglers. No infinite pestering.
        </p>
        <p>
          <strong className="text-gray-900">&quot;I&apos;m out&quot; is a real
          answer.</strong> Every invitation has a one-click opt-out. Opting out removes
          you from reminders immediately and lets everyone else stop waiting on you.
          Declining should be as easy as accepting.
        </p>
      </Section>

      <Section heading="Voters don&apos;t need an account">
        <p>
          Only the person creating a poll signs in, and even that is just a magic link —
          no password. Everyone invited votes straight from their email through a private
          link. No signup, no app, no password reset at 11pm. That single detail is why
          people actually respond.
        </p>
      </Section>

      <Section heading="What we write about">
        <p>
          Building this has meant thinking rather more than expected about how groups actually
          make decisions — why a chat thread cannot close one, how many options a poll should
          offer, what a deadline needs in order to be believed, and how to chase people without
          becoming insufferable. We write that up in the{" "}
          <Link href="/guides" className="text-indigo-600 hover:underline font-medium">
            guides
          </Link>
          . None of it requires planit; most of it is just how to ask a group a question they
          can answer.
        </p>
      </Section>

      <Section heading="What it costs">
        <p>
          Nothing. planit is free to use, with no paid tier and no card required. Hosting and
          email are paid for by advertising shown alongside the guides and other published pages
          on this site. You will not see an ad inside the app, on a voting screen, or in any
          email planit sends you.
        </p>
      </Section>

      <Section heading="Who makes it">
        <p>
          planit is an independent project, not a company — built and maintained by a very small
          team who got tired of watching plans die in group chats. Feedback and bug reports go to{" "}
          <a href="mailto:support@planitnow.us" className="text-indigo-600 hover:underline">
            support@planitnow.us
          </a>
          , and a human reads them.
        </p>
      </Section>

      <p>
        <Link href="/login" className="text-indigo-600 hover:underline font-medium">
          Start a poll →
        </Link>
      </p>
    </Prose>
  )
}
