import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "write-a-poll-people-answer"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        A poll that half the group ignores is worse than no poll at all. It costs you a week, it
        produces a result you do not trust, and it quietly teaches everyone that your invitations
        can be skipped without consequence &mdash; which makes the next one perform worse.
      </p>
      <p>
        Response rate is not a fact about your friends. It is a design outcome, and it responds to
        fairly mechanical changes: how many options you offer, how the question is worded, how much
        work the reply takes, and whether there is a deadline attached to anything.
      </p>

      <h2>Ask exactly one question</h2>
      <p>
        The most common mistake is stacking. <em>&ldquo;Which weekend works, and do we want the
        cabin or the coast, and is everyone okay with about $250 each?&rdquo;</em> That is three
        decisions, and they interact &mdash; the answer to the money question changes the answer to
        the destination question. Anyone who thinks carefully about it cannot answer at all, so they
        wait until they have time to reply properly, and that time never comes.
      </p>
      <p>
        Split it. Decide the thing that constrains everything else first, usually the date, and ask
        about it alone. A poll that takes fifteen seconds and gets nine replies beats a
        comprehensive one that takes four minutes and gets three.
      </p>

      <h2>Write options that are actually comparable</h2>
      <p>
        Options fail when they are not the same kind of thing. <em>&ldquo;Saturday, Sunday, or
        maybe the following weekend?&rdquo;</em> mixes two specific dates with a vague region of
        the calendar, so the third option collects the votes of everyone who wanted to defer rather
        than everyone who genuinely prefers it.
      </p>
      <p>Four rules cover most of it:</p>
      <ul>
        <li>
          <strong>Same granularity.</strong> All dates, or all date-and-time slots, or all venues.
          Never a mix.
        </li>
        <li>
          <strong>Concrete enough to act on.</strong> &ldquo;Thursday 12th, 7:30pm&rdquo; rather
          than &ldquo;sometime Thursday&rdquo;. Vagueness does not increase agreement; it postpones
          disagreement.
        </li>
        <li>
          <strong>No overlaps.</strong> If two options can both be true at once, votes split
          arbitrarily between them and the winner is an artifact of your wording.
        </li>
        <li>
          <strong>Carry the deciding detail inline.</strong> If price, travel time, or dress code
          is going to matter, put it in the option: &ldquo;Sushi place on 5th &mdash; about $50
          each&rdquo;. Otherwise people vote for a thing they have not actually evaluated, and you
          get the objection after you have booked.
        </li>
      </ul>

      <h2>Keep it to three to five options</h2>
      <p>
        Two options is a false binary and invites &ldquo;neither, what about&hellip;&rdquo;. Six or
        more is a research task, and it spreads the votes so thin that the winner looks arbitrary
        &mdash; a four-vote win out of nine people is not a mandate anyone feels bound by.
      </p>
      <p>
        If you genuinely have eight candidate restaurants, that is a two-round problem, not a
        long-ballot problem. Shortlist in the chat, vote on the shortlist.
      </p>
      <p>
        Order matters more than people expect: the first and last options in a list get a small but
        real boost. If you care about the result being clean, do not put your own favorite at the
        top.
      </p>

      <h2>Word it neutrally, then get out of the way</h2>
      <p>
        <em>&ldquo;Option 3 is the good one obviously 😄&rdquo;</em> reads as friendly and functions
        as a thumb on the scale. Once the organizer has signalled a preference, voting against it
        costs something socially, and quiet people stop being a useful signal.
      </p>
      <p>
        If you have a strong preference, the honest move is to say it plainly and separately &mdash;{" "}
        <em>&ldquo;full disclosure, I&rsquo;d prefer the Thursday, but vote for what works&rdquo;</em>{" "}
        &mdash; or to not run the poll at all and just propose the thing. What corrodes trust is a
        vote that was never really open.
      </p>

      <h2>Make the reply cost nothing</h2>
      <p>
        Every step between reading and answering loses people, and the losses are much larger than
        they feel:
      </p>
      <ul>
        <li>
          <strong>No account, no app.</strong> If answering requires signing up for something, a
          large share of any casual social group simply will not. This is the single biggest lever
          available, and it is entirely under your control when you choose the tool.
        </li>
        <li>
          <strong>Answerable on a phone, on the first screen.</strong> Most invitations are read
          within a minute of arriving, on a phone, while doing something else. If the options do not
          fit without zooming, the reply gets deferred, and deferred means forgotten.
        </li>
        <li>
          <strong>No required free text.</strong> An open comment box turns a fifteen-second tap
          into a composition task. Optional is fine; required is a response-rate tax.
        </li>
        <li>
          <strong>One tap to decline.</strong> Some people are out, and you want to know
          immediately. A visible &ldquo;count me out&rdquo; converts a week of silence into an
          instant, useful answer.
        </li>
      </ul>

      <h2>Say when it closes and what happens then</h2>
      <p>
        A deadline without a consequence is a suggestion. Compare:
      </p>
      <blockquote>
        Please reply by Thursday if you can!
      </blockquote>
      <blockquote>
        Voting closes Thursday 9pm. Whichever night has the most yeses wins, and I&rsquo;ll book it
        Friday morning.
      </blockquote>
      <p>
        The second one tells people the exact cost of not replying, which is the only thing that
        reliably converts intention into action. It also protects you: when you close on Thursday
        night with seven of nine votes in, nobody can reasonably object that they were still
        thinking about it.
      </p>
      <p>
        Two or three days is the right window for a casual plan. Longer does not collect more votes
        &mdash; it collects the same votes later, because people answer either immediately or after
        a reminder, almost never in between.
      </p>

      <h2>Tell people what they are joining</h2>
      <p>
        Two small additions measurably help. First, the size and shape of the group: &ldquo;this is
        going out to the usual nine&rdquo; helps people judge whether it is the kind of evening they
        want, and creates a mild, honest sense that their answer is being counted rather than
        collected. Second, how long the reply takes &mdash; literally, &ldquo;takes about twenty
        seconds&rdquo;. It sounds trivial. It moves the needle, because the reason people defer is
        that they cannot see the size of the task.
      </p>

      <h2>Plan the follow-up before you send</h2>
      <p>
        Assume you will need to nudge, and decide the cadence in advance rather than improvising it
        when you are irritated on Wednesday night. One reminder at roughly the halfway point and one
        a few hours before the deadline covers nearly every case, and both should say something new
        &mdash; how many people have answered, how long is left &mdash; rather than repeating the
        original message.
      </p>
      <p>
        Decide in advance what a non-response means, too, and say it in the invitation. The workable
        default is that non-voters are not counted as available for anything: they are not blocking
        the decision, and they are welcome to come to whatever the group picks.
      </p>

      <h2>Honor the result</h2>
      <p>
        The last piece of poll design happens after the poll. If you run a vote and then override
        it, or reopen it because one person who never voted turns out to be busy, you have taught
        the group that voting is theatre. Their next response rate will show it.
      </p>
      <p>
        Announce the outcome with the numbers, thank the people who answered, and go book it. If the
        result is genuinely unworkable &mdash; the winning night turns out to be impossible for the
        person whose apartment you are using &mdash; say exactly that, explain the constraint you missed,
        and run a fresh vote. What people accept is a stated reason. What they punish is a decision
        that quietly ignores their answer.
      </p>

      <h2>The checklist</h2>
      <ol>
        <li>One decision per poll.</li>
        <li>Three to five concrete, comparable options with the deciding details attached.</li>
        <li>Neutral wording; your preference disclosed separately or not at all.</li>
        <li>No account, no app, no required free text, works on a phone.</li>
        <li>A visible one-tap decline.</li>
        <li>A closing time and a stated rule for what wins.</li>
        <li>A planned reminder or two that carry new information.</li>
        <li>Announce the result with the count, and stick to it.</li>
      </ol>
    </Article>
  )
}
