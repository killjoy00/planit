import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "scheduling-across-time-zones"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        A group spread across time zones does not really have a scheduling problem. It has a
        fairness problem wearing a scheduling problem as a disguise. Finding an hour that
        technically exists for everyone is usually easy; finding one that is not miserable for the
        same unlucky person every single time is the actual work.
      </p>
      <p>
        Everything below is about making the cost visible and then distributing it, plus the small
        number of mechanical precautions that stop somebody missing the whole thing by an hour.
      </p>

      <h2>Never send a time without a zone</h2>
      <p>
        &ldquo;7pm&rdquo; in a group spanning four countries is not a time. It is four different
        times, and at least one person will pick the wrong one.
      </p>
      <p>Three habits prevent nearly every version of this:</p>
      <ul>
        <li>
          <strong>Always attach the zone,</strong> and use the abbreviation people actually
          recognize &mdash; &ldquo;7pm ET&rdquo;, &ldquo;19:00 CET&rdquo;. If the group spans more
          than about three zones, quote a single reference like UTC and let people convert once.
        </li>
        <li>
          <strong>Always include the date with the time.</strong> When a group spans enough
          longitude, one person&rsquo;s Friday evening is another&rsquo;s Saturday morning, and a
          bare weekday is genuinely ambiguous.
        </li>
        <li>
          <strong>Send a calendar file.</strong> This is the most reliable fix available, because it
          removes human arithmetic entirely &mdash; the recipient&rsquo;s device does the
          conversion, correctly, including the awkward cases below. If you are offering options in
          a poll, the winning option should arrive as something people can add to a calendar in one
          tap.
        </li>
      </ul>

      <h2>The daylight saving trap</h2>
      <p>
        This is the one that catches careful people. Countries do not change their clocks on the
        same date, so the offset between two cities is not a constant &mdash; it shifts, and there
        are stretches of the year when the usual gap is simply wrong.
      </p>
      <p>
        The United States moves to daylight time on the second Sunday in March and back on the
        first Sunday in November. Most of Europe moves on the last Sunday in March and back on the
        last Sunday in October. That leaves roughly three weeks each spring, and about a week each
        autumn, when the familiar offset between, say, New York and London is an hour off what
        everyone assumes. Australia is on the opposite hemisphere&rsquo;s schedule entirely, and
        plenty of places &mdash; much of Asia, most of Africa, Arizona, Hawaii &mdash; do not
        change at all.
      </p>
      <p>
        The practical rule: <strong>never compute an offset once and reuse it.</strong> For
        anything more than a week out, work from the actual calendar date rather than from
        &ldquo;London is five hours ahead.&rdquo; A recurring event scheduled in one person&rsquo;s
        local time will silently drift for everyone else twice a year, which is how a standing call
        ends up an hour early for half the group with no explanation.
      </p>

      <h2>Measure how bad it is, not whether it overlaps</h2>
      <p>
        The common approach is to hunt for a slot inside everyone&rsquo;s working or waking hours
        and take the first one that fits. That treats all fits as equal, which they emphatically
        are not: a slot at 9am for one person and 11pm for another technically overlaps and is
        obviously not fine.
      </p>
      <p>
        A better method takes about two minutes. Give each person a comfortable window &mdash; say
        8am to 9pm local &mdash; and, for each candidate slot, count two things: how many people
        fall outside their window, and by how much. A slot that puts one person thirty minutes past
        the edge is very different from one that puts them three hours past it, and a single number
        for &ldquo;overlap&rdquo; hides that completely.
      </p>
      <p>
        Then pick the slot with the least total pain, not the one with the most bodies inside the
        window. Those are frequently different answers, and the difference is usually whichever
        person is in the minority zone.
      </p>

      <h2>When no good slot exists, rotate</h2>
      <p>
        Once a group spans more than about twelve hours of longitude, there is no time that is
        comfortable for everyone. It is not a search problem any more; the slot does not exist.
      </p>
      <p>
        At that point you have three honest options, and pretending otherwise just means the
        default quietly wins:
      </p>
      <ul>
        <li>
          <strong>Rotate the burden.</strong> Alternate between a slot that is early for the west
          and one that is late for the east, and <em>write down whose turn it is</em>. Rotation
          that lives in memory always drifts toward whoever complains least.
        </li>
        <li>
          <strong>Split the group.</strong> Two comfortable gatherings usually beat one that half
          the people attend resentfully. This is not a failure; it is an accurate response to the
          fact that you have two clusters.
        </li>
        <li>
          <strong>Go asynchronous.</strong> A surprising amount of what groups do together does not
          need everyone present simultaneously &mdash; decisions especially. A poll with a
          forty-eight hour window is time zone agnostic by construction, which is much of why
          voting by email works better than trying to get everyone into a call to decide.
        </li>
      </ul>
      <p>
        One thing to avoid: solving it by always deferring to the largest cluster. It is the
        natural default and it reliably produces the same outcome, which is that your one friend in
        Auckland stops coming.
      </p>

      <h2>Put a zone on the deadline too</h2>
      <p>
        Easy to miss. &ldquo;Voting closes Thursday 9pm&rdquo; sounds precise and is not. For
        someone eight hours behind you, Thursday 9pm your time is Thursday lunchtime theirs
        &mdash; they have lost most of the day they thought they had, and they find out by
        discovering the poll already closed.
      </p>
      <p>
        Write &ldquo;closes Thursday 9pm ET&rdquo;, and when zones are wide, be slightly generous
        with the window. A deadline that lands mid-morning somewhere is functionally a shorter
        deadline for those people.
      </p>

      <h2>A workable default</h2>
      <ol>
        <li>Collect everyone&rsquo;s actual zone once, and keep it written down.</li>
        <li>
          Propose three or four slots, each stated in a single reference zone plus the date.
        </li>
        <li>
          Let people mark each slot as fine, awkward, or impossible &mdash; three levels, not two.
          The middle one is where all the useful information lives.
        </li>
        <li>Pick the slot with the least total awkwardness, not the most bare acceptances.</li>
        <li>
          If nothing is comfortable, rotate and record whose turn it was.
        </li>
        <li>Send the result as a calendar invitation so nobody converts anything by hand.</li>
      </ol>
      <p>
        The whole thing rests on one idea: the cost of a bad hour is real, it lands on specific
        people, and a group that refuses to look at who is paying it will keep sending the bill to
        the same person until they quietly stop showing up.
      </p>
    </Article>
  )
}
