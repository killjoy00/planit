import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "planning-a-group-dinner"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Group dinners fail differently from group trips. A trip collapses over months, from
        sequencing. A dinner collapses in a week, and usually over one of four things: the table
        you could not book, the price nobody mentioned, the dietary constraint that arrived too
        late, or the fact that a table of eleven is not a conversation.
      </p>
      <p>
        The order below is built around the one constraint people consistently discover last.
      </p>

      <h2>The table decides the guest list</h2>
      <p>
        Most people plan a dinner in this order: figure out who is coming, then find somewhere to
        eat. For groups above about six, that is backwards, because restaurant capacity for large
        parties is far more constrained than it looks from the outside.
      </p>
      <p>Roughly what changes as the number grows:</p>
      <ul>
        <li>
          <strong>Up to about six</strong> is an ordinary reservation, bookable online, often
          available the same week.
        </li>
        <li>
          <strong>Seven to ten</strong> frequently means calling rather than booking online, a
          narrower set of available times, and sometimes a limited menu.
        </li>
        <li>
          <strong>Above ten</strong> often means a set menu, a deposit, a minimum spend, or a
          private room &mdash; and a booking window measured in weeks.
        </li>
      </ul>
      <p>
        So establish the approximate headcount early, and let it determine which places are even
        candidates. A shortlist assembled without knowing whether you are nine or fourteen is a
        shortlist you will have to throw away.
      </p>

      <h2>Work backwards from the reservation window</h2>
      <p>
        The deadline for your poll is not a matter of taste. It is set by when you need to call the
        restaurant, which is set by how far out that restaurant books. If the place you want takes
        reservations three weeks ahead and fills them, your date has to be settled more than three
        weeks ahead, and everything else compresses to fit.
      </p>
      <p>
        Say this in the invitation rather than keeping it to yourself. &ldquo;I need to call them
        Monday, so voting closes Sunday night&rdquo; is a deadline with a visible reason, and
        people treat those very differently from arbitrary ones.
      </p>

      <h2>Lock the number before you book it</h2>
      <p>
        Book for the number you are confident about, not the number who expressed interest.
        Reserving for twelve and arriving with eight is worse than reserving for eight: it visibly
        costs the restaurant a table, it is increasingly likely to come with a cancellation fee, and
        it is the single fastest way to become someone a good restaurant will not seat again.
      </p>
      <p>
        The mechanism that gets you a real number is the same one that works for trips &mdash; a
        deadline with a consequence attached. &ldquo;I&rsquo;m booking for whoever has said yes by
        Sunday&rdquo; converts a soft maybe into an actual answer, because it makes clear that not
        answering is itself a decision.
      </p>
      <p>
        If people are likely to drop late, book slightly under and ask whether the restaurant can
        add a chair. Most can add one more easily than they can absorb three empty seats.
      </p>

      <h2>Dietary constraints are a filter, not a vote</h2>
      <p>
        Collect them before you build the shortlist, not after. A vote that produces a winner one
        person cannot eat at is the worst available outcome: legitimate and unusable.
      </p>
      <p>
        Ask specifically and privately. &ldquo;Any allergies, or anything you don&rsquo;t
        eat?&rdquo; sent to each person gets much better information than the same question posted
        to a group thread, where announcing a restriction feels like imposing on everyone. Be clear
        that you want both the hard constraints and the strong preferences, and that they will be
        treated differently &mdash; an allergy rules a place out, a mild dislike just means
        checking there is something else on the menu.
      </p>
      <p>
        Then check the actual menu rather than the cuisine. &ldquo;There&rsquo;ll be something
        vegetarian&rdquo; is an assumption that fails often enough to be worth thirty seconds of
        verification.
      </p>

      <h2>Put the price in the invitation</h2>
      <p>
        Every option on the shortlist should carry a per-head estimate, including drinks if drinks
        are likely. &ldquo;About $55 each with a glass of wine&rdquo; costs you nothing to write
        and gives people a graceful exit while declining is still free.
      </p>
      <p>
        Without it, the person for whom this is a stretch finds out at the table, where their
        options are to overspend quietly or to say so in front of everyone. They will nearly always
        overspend, and they will nearly always be busy next time. The reason the dinner group
        shrinks is rarely that people stopped liking each other.
      </p>
      <p>
        Decide the split before anyone orders, too &mdash; announced at the start it is a fair
        question, announced with the check it is a bill.
      </p>

      <h2>A table of eleven is not a conversation</h2>
      <p>
        The thing nobody plans for. At a long table, you can realistically talk to the two people
        beside you and the one opposite. Everyone else may as well be at a different restaurant,
        and the seating you fell into at the start is the seating you have for three hours.
      </p>
      <p>
        If the point of the evening is catching up with specific people, this matters more than the
        food. Some ways to handle it:
      </p>
      <ul>
        <li>
          <strong>Round beats long.</strong> A round table of eight sustains one conversation far
          better than a rectangle of eight.
        </li>
        <li>
          <strong>Two tables of six beat one of twelve,</strong> if the venue allows it and
          especially if people move between courses.
        </li>
        <li>
          <strong>Check the noise.</strong> A room that is pleasantly lively for four is unworkable
          for ten &mdash; you end up shouting at your immediate neighbor and nodding at everyone
          else. Reviews mention this; it is worth reading for.
        </li>
        <li>
          <strong>Consider not going out.</strong> A dinner at somebody&rsquo;s home, potluck or
          otherwise, is cheaper, has no reservation constraint, no noise problem, and people can
          move around. For a large group it is frequently the better evening, and the only reason
          it gets skipped is that hosting feels like more work than it is.
        </li>
      </ul>

      <h2>The last twenty-four hours</h2>
      <p>
        Confirm with the restaurant and with the group on the day before. Both matter: restaurants
        do lose bookings, and people do forget.
      </p>
      <p>
        Send one message with everything needed in it &mdash; name, address, time, and the split
        arrangement. Not a thread to scroll, one message. And tell people a time fifteen minutes
        earlier than the reservation, because a party of eight told to arrive at seven arrives at
        seven twenty, and many restaurants only hold a table for fifteen minutes.
      </p>

      <h2>The order that works</h2>
      <ol>
        <li>Rough headcount first &mdash; it determines which venues are possible at all.</li>
        <li>Collect dietary constraints privately, before the shortlist exists.</li>
        <li>
          Build three or four options that fit the headcount and the constraints, each with a
          per-head price.
        </li>
        <li>
          Set the voting deadline from the reservation window, and say why it is that date.
        </li>
        <li>Book for the confirmed number, not the interested number.</li>
        <li>Announce the split method before anyone orders.</li>
        <li>Confirm the day before, and tell people fifteen minutes early.</li>
      </ol>
    </Article>
  )
}
