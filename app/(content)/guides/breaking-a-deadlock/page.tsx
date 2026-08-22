import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "breaking-a-deadlock"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Two options tied at four votes each. Or every date blocked by someone different. Or a
        thread that has been circling the same three restaurants for nine days.
      </p>
      <p>
        The instinct is to keep discussing until something gives. It almost never does. After the
        first round of arguments, additional discussion adds very little information &mdash;
        everyone has already said what they think &mdash; while continuing to cost attention and
        goodwill. What breaks a deadlock is changing the structure of the question, not applying
        more pressure to the current one.
      </p>
      <p>Five ways out, in the order worth trying them.</p>

      <h2>1. Relax a constraint</h2>
      <p>
        A deadlock is usually a sign that the constraint set is over-tight rather than that the
        group is difficult. Somewhere in the setup is a requirement everyone has been treating as
        fixed that is not actually fixed.
      </p>
      <p>
        The most common culprit is the assumption that everyone must be there. Second most common
        is a day-of-week or time-of-day rule nobody has questioned &mdash; it has to be Saturday
        night, it has to be dinner, it has to be this month. Third is budget, which is real but
        frequently narrower than it needs to be because nobody has stated the actual number.
      </p>
      <p>
        Ask it directly: <em>what would have to be true for this to be easy?</em> If the answer is
        &ldquo;if we did it on a Sunday afternoon&rdquo; or &ldquo;if it were fine for six of us to
        go&rdquo;, you have found the constraint that is doing the blocking, and you can ask
        whether it deserves its status.
      </p>

      <h2>2. Find the disagreement you are not having</h2>
      <p>
        Persistent deadlock over something small is often a proxy for something larger that nobody
        has named. A group that cannot choose between two restaurants is frequently not disagreeing
        about food. They are disagreeing about money, or about how late the evening goes, or about
        whether this is a quiet catch-up or a night out &mdash; and the restaurants are standing in
        for those positions.
      </p>
      <p>
        You can usually spot it because the arguments do not match the stakes. When people are
        unusually invested in a low-consequence choice, there is a higher-consequence question
        underneath it.
      </p>
      <p>
        Surfacing it directly is faster and less awkward than it sounds: <em>&ldquo;Are we actually
        disagreeing about the price?&rdquo;</em> Once the real dimension is on the table it is
        usually settled quickly, and the original choice stops mattering.
      </p>

      <h2>3. Go back and add options</h2>
      <p>
        A stubborn tie between two options frequently means the option people would actually be
        happy with is not on the ballot. This happens when the list was assembled fast, or by one
        person, or when the good candidate got ruled out early for a reason that has since stopped
        applying.
      </p>
      <p>
        Reopening the option set is legitimate; reopening the vote is not. The difference matters.
        Say plainly that the shortlist was wrong, collect suggestions for a fixed short window, and
        run one clean round on the new list. What corrodes trust is quietly re-running the same
        vote hoping for a different answer.
      </p>
      <p>
        One caution: this move has exactly one use. If a second round also deadlocks, adding more
        options is not the problem and will not be the solution. Move on to the next two.
      </p>

      <h2>4. Split the group</h2>
      <p>
        The most underused option, and often the correct one. A persistent even split is frequently
        not indecision at all &mdash; it is accurate information that you have two clusters of
        people who want two different things.
      </p>
      <p>
        Four people going to the late thing and four going to the early thing is not a failed plan.
        It is two plans, both of which will actually happen, in place of one that has not happened
        in a week and a half. Groups resist this because it feels like fragmentation, but the
        honest comparison is not against a unified evening; it is against continued stalemate.
      </p>
      <p>
        This applies more the larger the group. Above about eight people, the assumption that
        everyone does the same thing together is already doing a lot of unexamined work.
      </p>

      <h2>5. Decide by rule, not by argument</h2>
      <p>
        When the options are genuinely close and the group genuinely cannot separate them, stop
        trying to. Apply a rule.
      </p>
      <p>Rules that work, roughly in order of how well they hold up socially:</p>
      <ul>
        <li>
          <strong>Rotating decider.</strong> One person picks, and next time it is someone
          else&rsquo;s turn. This is far and away the best mechanism for recurring groups: it
          resolves instantly, it is obviously fair over time, and it converts an argument into a
          small privilege. Write down whose turn it is, because rotations kept in memory drift
          toward whoever is most assertive.
        </li>
        <li>
          <strong>A pre-committed tiebreak.</strong> Earliest date wins, cheapest option wins,
          closest to the most people wins. Any of these is fine. What makes them work is being
          declared <em>before</em> the vote opens, so nobody can suspect the rule was chosen to
          produce a particular result.
        </li>
        <li>
          <strong>A coin flip.</strong> More legitimate than it feels. A tie is direct evidence
          that the group as a whole is indifferent between the options, and when the group is
          indifferent, randomness is a perfectly good selection method. Most resistance to flipping
          a coin is really reluctance to admit you do not have a strong preference &mdash; if
          someone objects hard, you have just learned something useful about their actual position.
        </li>
        <li>
          <strong>The organizer decides.</strong> Fine occasionally, corrosive as a default. The
          person doing the work gets some latitude, but a group where the organizer always breaks
          the tie is a group that will eventually stop bothering to vote.
        </li>
      </ul>

      <h2>Two failure modes worth naming</h2>
      <p>
        <strong>The deadlock that is actually one person.</strong> Sometimes &ldquo;we cannot
        agree&rdquo; means one individual has an objection to every option. That is not a group
        decision problem and no voting rule will fix it. Talk to them privately, find out what the
        real constraint is, and either accommodate it explicitly or plan without them. Doing
        nothing hands one person a veto over eight.
      </p>
      <p>
        <strong>Unlimited vetoes.</strong> A veto has to be backed by a constraint &mdash; cannot
        eat it, cannot afford it, cannot get there &mdash; not by a preference. Once
        &ldquo;I&rsquo;d rather not&rdquo; is treated as blocking, everyone has a veto, and a group
        where everyone has a veto cannot decide anything. Separate the two out loud when you build
        the option list, and keep constraints as a filter applied before the vote rather than as
        votes.
      </p>

      <h2>The structural fix</h2>
      <p>
        Most deadlocks are preventable, and the prevention is one line in the invitation: say how
        ties break before anyone votes.
      </p>
      <blockquote>
        Tick everything that works. Most ticks wins; if two tie, the earlier date takes it. Closes
        Thursday 9pm.
      </blockquote>
      <p>
        A rule announced in advance is arithmetic. The same rule produced afterward is a decision
        somebody made, and it will be read that way no matter how fair it is. Set a default too
        &mdash; what happens if the whole thing stalls &mdash; because a stated default beats a
        deadlock every time, and the plan you make by rule is worth much more than the perfect plan
        you never make.
      </p>
    </Article>
  )
}
