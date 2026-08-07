import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "follow-up-without-nagging"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Chasing responses is the part of organizing that makes people stop organizing. It is not
        the work &mdash; the work is ten minutes. It is the feeling of standing in a group chat
        asking eight adults, for the third time, whether they are coming to dinner.
      </p>
      <p>
        That feeling is real, but it is mostly a symptom of badly written follow-ups. A reminder
        that carries new information, arrives on a schedule you announced, and offers an easy exit
        does not read as nagging. It reads as competence.
      </p>

      <h2>Start from the right assumption</h2>
      <p>
        The overwhelming majority of non-responses are not refusals. They are people who read your
        message on a phone, standing in line somewhere, intending to answer properly later, and then later
        happened. Almost nobody is deliberately ignoring you, and the small number who are
        genuinely ambivalent are usually staying quiet because saying no felt awkward &mdash; which
        is a problem you can fix directly.
      </p>
      <p>
        If you believe you are pestering people who have already decided, every reminder feels like
        an imposition and you will write it apologetically, which makes it worse. If you believe
        you are rescuing something from someone&rsquo;s notification pile, you will write it
        plainly, which is what works.
      </p>

      <h2>Rule one: every follow-up carries something new</h2>
      <p>
        A reminder that repeats the original message is what actually produces the nagging feeling
        &mdash; for you and for them. Give the second message a reason to exist:
      </p>
      <ul>
        <li>
          <strong>Progress.</strong> &ldquo;Five of nine have voted so far.&rdquo; This is the
          single most effective line available. It tells people the thing is real, that others are
          participating, and that their answer is a countable part of something.
        </li>
        <li>
          <strong>Time remaining.</strong> &ldquo;Closing tomorrow at 9pm.&rdquo; A deadline that
          is being actively counted down is a deadline people believe in.
        </li>
        <li>
          <strong>A narrowing.</strong> &ldquo;The 12th is out &mdash; three people can&rsquo;t do
          it. It&rsquo;s between the 19th and the 26th now.&rdquo; The question got smaller, which
          makes answering cheaper.
        </li>
        <li>
          <strong>A consequence.</strong> &ldquo;I need to book Friday morning, so whatever&rsquo;s
          leading on Thursday night is what we&rsquo;re doing.&rdquo;
        </li>
      </ul>

      <h2>Rule two: two reminders, on a stated schedule</h2>
      <p>
        For a poll running three days, one nudge around the halfway point and one a few hours
        before the close covers almost everything. Response curves are lumpy, not smooth: people
        answer either within minutes of receiving something, or not at all, so the value of a
        reminder is almost entirely in creating a fresh <em>within minutes</em> moment. Two of
        those is usually all the traffic a casual plan can bear.
      </p>
      <p>
        Say the schedule up front in the original invitation &mdash; &ldquo;I&rsquo;ll nudge once on
        Wednesday and once before it closes&rdquo;. Announced reminders are not nagging; they are a
        process people agreed to by not objecting.
      </p>
      <p>
        Timing within the day matters more than people think. Early evening on a weekday, or
        mid-morning Tuesday to Thursday, both land when someone can actually open a calendar. Late
        at night and Friday afternoon are wasted sends.
      </p>

      <h2>Rule three: escalate specificity, never emotion</h2>
      <p>
        There is a natural progression from broad to personal, and it works because it changes who
        is being asked, not how guilty they should feel.
      </p>
      <ol>
        <li>
          <strong>First nudge, everyone, neutral.</strong> &ldquo;Quick reminder &mdash; five of
          nine in, closes Thursday 9pm.&rdquo;
        </li>
        <li>
          <strong>Second nudge, only the people who have not answered, still light.</strong>{" "}
          &ldquo;Closing tonight &mdash; twenty seconds if you get a chance, and totally fine to
          say you&rsquo;re out.&rdquo;
        </li>
        <li>
          <strong>Third contact, if it genuinely matters, individually and by a different
          channel.</strong> A direct message to the one person whose presence changes whether the
          thing happens. Not a broadcast.
        </li>
      </ol>
      <p>
        What does not belong anywhere in that sequence: sighing in public, counting how many times
        you have asked, or the passive-aggressive ellipsis. Those get you a reply once, and cost
        you the next three plans.
      </p>

      <h2>Rule four: always include the exit</h2>
      <p>
        The highest-yield sentence in any follow-up is some version of:
      </p>
      <blockquote>
        If you&rsquo;re not up for it, just say so &mdash; genuinely no problem, and I&rsquo;ll stop
        bothering you.
      </blockquote>
      <p>
        A large share of silence is people who have decided against and cannot find a graceful way
        to say it. Explicitly pricing the no at zero converts those silences into answers
        immediately, and an answered no is worth far more to you than an unanswered maybe. It tells
        you the real size of the group, and it lets you stop counting that person as pending.
      </p>
      <p>
        Make declining mechanically easy too. If the only way to say no is to compose a message
        explaining yourself in front of everyone, you have made the cheap option silence, and
        people will keep taking it.
      </p>

      <h2>Rule five: stop when you said you would</h2>
      <p>
        Follow-ups are tolerable because they end. When the deadline passes, close the poll,
        announce the result with the count, and never mention the vote again. No fourth reminder,
        no reopening, no chasing the two people who never replied to see if they would have
        preferred something else.
      </p>
      <p>
        This is what separates a process from pestering. Everybody in the group learns, over a few
        rounds, that your invitations have a fixed cost: read it, tap once, done, and it will not
        follow you around. That reputation is worth more than any individual response, and you
        build it by stopping on time.
      </p>

      <h2>Do the chasing privately</h2>
      <p>
        Public reminders in the group chat have the wrong economics. They are visible to the seven
        people who already answered, which is noise for them; and they put mild social pressure on
        the two who have not, in front of an audience, which makes replying feel like an admission.
        The predictable result is that the least responsive people become <em>more</em> reluctant.
      </p>
      <p>
        Send the nudge to the people it concerns, and only them. If the tool you are using cannot
        do that, at minimum send the second reminder as individual messages rather than posting it
        to the room.
      </p>

      <h2>The person who never replies</h2>
      <p>
        Every group has one. It is usually not indifference &mdash; it correlates far more with
        people who do not keep a calendar, or whose week genuinely is unpredictable until it
        happens. Chasing them harder does not work and slowly makes the friendship transactional.
      </p>
      <p>What does work:</p>
      <ul>
        <li>
          <strong>Ask once, directly, outside the plan.</strong> &ldquo;Do you want to be on these
          invites at all? Completely fine either way.&rdquo; Sometimes the honest answer is no, and
          knowing it is a relief for both of you.
        </li>
        <li>
          <strong>Change their default.</strong> Treat them as not counted rather than pending.
          Invite them, do not wait for them, and tell them the plan once it exists: &ldquo;Thursday
          8pm at the usual place if you&rsquo;re around.&rdquo; A lot of unreliable repliers are
          perfectly reliable attenders.
        </li>
        <li>
          <strong>Never let one person block a decision.</strong> If a group of nine is waiting on
          the same individual every time, the problem is the rule you are using, not them.
        </li>
      </ul>

      <h2>If you are the one not replying</h2>
      <p>
        Worth saying, because most of us are on both sides of this. The polite instinct &mdash;
        wait until I can answer properly &mdash; is the one that causes the damage. A fifteen-second
        approximate answer today is far more useful to whoever is organizing than a considered one
        next week, and an immediate &ldquo;count me out&rdquo; is a genuine kindness. The only
        genuinely rude reply is the one that never arrives.
      </p>
    </Article>
  )
}
