import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "pick-a-date-everyone-can-make"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Almost every group plan that dies, dies at the date. Not at the idea &mdash; everyone
        agreed the idea was good. It dies in the week after someone asks{" "}
        <em>&ldquo;so when is everyone free?&rdquo;</em> and the thread slowly fills with partial,
        conditional, mutually incomparable answers until the moment passes.
      </p>
      <p>
        This is a solvable problem, and the solution is not better friends. It is asking a
        different question.
      </p>

      <h2>Why &ldquo;when are you free?&rdquo; fails</h2>
      <p>
        The question is cheap to ask and expensive to answer. To reply properly, someone has to
        open a calendar, scan an undefined range of future weeks, work out which commitments are
        movable, and then compose that into prose. That is a five-minute task dropped on eight
        people at once, and most of them are reading it while walking somewhere.
      </p>
      <p>
        So they do the cheap thing instead. They answer approximately: <em>&ldquo;most evenings
        work, not Tuesdays&rdquo;</em>, <em>&ldquo;weekends better for me&rdquo;</em>,{" "}
        <em>&ldquo;I&rsquo;m pretty flexible!&rdquo;</em> Every one of those is a friendly,
        well-meant, completely unusable answer. You cannot intersect them. You now have to do a
        second pass to convert vague availability into a concrete proposal, and by then two people
        have stopped reading the thread.
      </p>
      <p>
        There is a second failure hiding in there. An open question has no wrong answer, so it has
        no <em>completion</em>. Nobody can tell whether the group has finished answering. With no
        finish line, there is no moment where a decision is obviously due, and the plan just idles.
      </p>

      <h2>Ask a closed question instead</h2>
      <p>
        Replace <em>when are you free?</em> with <em>which of these four work?</em> Recognition is
        far easier than recall: checking whether you are busy on three named evenings takes about
        fifteen seconds and no composition. It is answerable at a bus stop, which is where most of
        your invitations get read.
      </p>
      <p>Concretely, a good date question has five properties:</p>
      <ul>
        <li>
          <strong>Specific options.</strong> Not &ldquo;the weekend of the 14th&rdquo; but
          &ldquo;Saturday 14th, 7pm&rdquo;. Times matter as much as dates &mdash; half the
          conflicts in a group schedule are time-of-day conflicts, and a date without a time hides
          them until later.
        </li>
        <li>
          <strong>Multiple selection.</strong> People tick every option that works, not their
          favourite. This is the single highest-leverage change you can make, and the next section
          explains why.
        </li>
        <li>
          <strong>An explicit way to decline.</strong> A visible &ldquo;none of these&rdquo; or
          &ldquo;count me out&rdquo; is not pessimism; it is the difference between a fast no and a
          week of silence.
        </li>
        <li>
          <strong>A deadline with a stated consequence.</strong> &ldquo;Closes Thursday
          9pm&rdquo; means nothing on its own. &ldquo;Closes Thursday 9pm, whichever night has the
          most yeses wins&rdquo; is a rule people can act on.
        </li>
        <li>
          <strong>One sender, one thread.</strong> If the poll goes out and then someone proposes a
          fifth date in the chat, you now have two elections running. Fold late suggestions into
          the poll or rule them out; do not let them run in parallel.
        </li>
      </ul>

      <h2>Let people tick more than one</h2>
      <p>
        If everyone picks a single favourite night out of four, the votes scatter. Six people and
        four options gives you a winner with two or three votes, which means half the group has an
        objection you never wrote down. Worse, the losing options might have been fine for
        everybody &mdash; they just were not anyone&rsquo;s first choice.
      </p>
      <p>
        Multiple selection asks a different question: not <em>which do you prefer</em> but{" "}
        <em>which can you do</em>. Now the winner is the night with the widest overlap, which is
        exactly what you were trying to find. This is approval voting, and for scheduling it is
        almost always the right method &mdash; availability is genuinely binary in a way that
        preference is not.
      </p>
      <p>
        A useful refinement: let people mark an option as workable but inconvenient. In practice
        &ldquo;I can make Thursday but I&rsquo;d have to leave at nine&rdquo; is information you
        want before you pick Thursday, not after.
      </p>

      <h2>How many options to offer</h2>
      <p>
        Three to five. Below three you are usually just proposing a date with extra steps, and the
        odds that at least one lands are poor. Above five, two things go wrong at once: the reply
        stops being a fifteen-second task, and the votes spread so thin that no option looks like a
        clear winner.
      </p>
      <p>Pick those options with a bit of deliberate spread rather than clustering them:</p>
      <ul>
        <li>
          <strong>Across weeks, not days.</strong> Three consecutive Thursdays beats Tuesday,
          Wednesday, and Thursday of the same week &mdash; whoever is travelling that week is out
          of all three.
        </li>
        <li>
          <strong>Mix weekday and weekend</strong> if the activity allows it. These fail for
          completely different people, so offering both widens the net more than adding a fourth
          weekday.
        </li>
        <li>
          <strong>Far enough out to be real.</strong> For a group of six or more, anything less
          than two weeks&rsquo; notice competes with plans people have already made. Two to four
          weeks is the sweet spot; beyond six weeks people will happily tick everything and then
          discover a conflict later.
        </li>
      </ul>

      <h2>Set the closing rule before you send</h2>
      <p>
        The most common reason a poll stays open forever is that the organiser never decided what
        &ldquo;enough&rdquo; means. Decide it in advance and put it in the invitation. Two rules
        cover almost every case:
      </p>
      <ul>
        <li>
          <strong>Deadline first.</strong> Voting closes at a stated time; the option with the most
          yeses at that moment wins. Non-voters are counted as available for nothing, which is the
          honest reading of a non-answer.
        </li>
        <li>
          <strong>Quorum first.</strong> As soon as an option clears a threshold you named
          beforehand &mdash; a simple majority, or &ldquo;any five of the eight&rdquo; &mdash; it
          wins and the poll closes early. Good for groups where a subset going ahead is genuinely
          fine.
        </li>
      </ul>
      <p>
        What you should not do is wait for unanimity. Unanimity in a group of eight is a coin flip
        at best, and waiting for it hands a veto to whoever is slowest to reply. Decide up front how
        many people constitute the plan, and let the rest join if they can.
      </p>

      <h2>Send it at a time people can act on</h2>
      <p>
        Invitations sent on Friday evening get read in a state of mind that does not open calendars.
        So do invitations sent at 9am Monday, which land in the same triage as the working week.
        Mid-morning Tuesday through Thursday reliably outperforms both: people are at a desk, they
        have their calendar open, and the reply costs them nothing.
      </p>
      <p>
        If the group is spread across time zones, send at a time that is reasonable for the{" "}
        <em>latest</em> zone, and state option times with the zone attached. &ldquo;7pm&rdquo; in a
        four-country group is not a time, it is four different times, and someone will discover
        that at the worst moment.
      </p>

      <h2>After the vote closes</h2>
      <p>
        Announce the result, once, with the number attached: <em>&ldquo;Saturday the 14th &mdash;
        six of eight can make it. Booking now.&rdquo;</em> The count matters because it tells the
        two people who cannot make it that the decision was made on the numbers, not against them.
      </p>
      <p>
        Then hold the decision. The strongest temptation in group planning is to reopen the date
        when someone who did not vote turns out to be busy. Do not. Reopening teaches the group
        that the deadline was decorative, and the next poll will get half the responses. If it
        matters that a specific person is there, that is a different conversation to have with them
        directly &mdash; before you send the poll, not after it closes.
      </p>

      <h2>The short version</h2>
      <ol>
        <li>Offer three to five specific date-and-time options, spread across different weeks.</li>
        <li>Let people tick every option that works, not just their favourite.</li>
        <li>Give them a visible way to say no.</li>
        <li>State the deadline and what happens when it passes.</li>
        <li>Close on schedule, announce the count, and do not reopen.</li>
      </ol>
      <p>
        None of this requires a tool. It does require someone to make the decisions above before
        hitting send &mdash; which is the actual work, and the part that a group chat quietly hides
        from you.
      </p>
    </Article>
  )
}
