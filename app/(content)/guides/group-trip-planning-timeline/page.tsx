import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "group-trip-planning-timeline"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Group trips rarely collapse from lack of enthusiasm. They collapse from sequencing: the
        destination gets picked before the dates, the dates get locked before anyone has said what
        they can spend, and the money conversation finally happens six weeks in, at which point two
        people quietly drop out and the villa no longer works.
      </p>
      <p>
        The fix is an order of operations and a set of deadlines. Below is a timeline that works,
        counted backwards from departure, along with the reasoning for each step &mdash; because
        the order is the part that matters, and you will need to compress it for a weekend away.
      </p>

      <h2>The principle: decide each thing when being wrong is still cheap</h2>
      <p>
        Every decision in a trip constrains the ones after it. Dates constrain who can come; budget
        constrains where you can go; destination constrains what you book. Making them out of order
        means revisiting settled things, and each revisit costs you a little of the
        group&rsquo;s attention and a little of its goodwill.
      </p>
      <p>
        There is a second principle underneath it: <strong>the group should shrink early</strong>.
        A trip that starts with eleven interested people and departs with seven is completely
        normal. What you want is to discover which seven in week two, not week eight. Every
        mechanism below &mdash; explicit budgets, real deadlines, deposits &mdash; exists to move
        the shrinkage forward to when it is harmless.
      </p>

      <h2>Twelve weeks out: the sounding</h2>
      <p>
        Ask about the idea of a trip, not a specific trip. &ldquo;Thinking about four or five days
        somewhere in September, roughly mid-range on cost. Who&rsquo;s interested in principle?&rdquo;
      </p>
      <p>
        You are establishing two numbers: roughly how many people, and roughly what kind of trip.
        Do not attach a destination yet &mdash; the moment you say a place, people start forming
        attachments to it, and you will be negotiating against those attachments for the next month
        when the dates turn out not to work.
      </p>
      <p>
        Expect the &ldquo;in principle&rdquo; group to be about a third larger than the group that
        actually travels. Plan accordingly, and do not treat early enthusiasm as commitment.
      </p>

      <h2>Ten weeks out: lock the dates</h2>
      <p>
        Dates first, because they are the constraint nobody can negotiate. Offer three or four
        specific windows &mdash; not months, actual departure and return dates &mdash; and let
        people tick every window they can do. Set a deadline of three or four days and state that
        the window with the widest availability wins.
      </p>
      <p>
        This is the step where the real group appears. Someone who ticks nothing is not coming, and
        that is genuinely useful information delivered ten weeks early. Do not chase people into a
        window that does not work for them; a trip built around one person&rsquo;s reluctant
        compromise tends to produce a cancellation later.
      </p>
      <p>
        Once the window has the most votes, announce it as decided and stop taking date input. From
        here on the dates are a fact, not a topic.
      </p>

      <h2>Nine weeks out: the money conversation</h2>
      <p>
        This is the step everyone skips and it is the one that determines whether the trip holds
        together. Have it before the destination, in explicit numbers, and in a form where people
        can answer honestly.
      </p>
      <p>Three things make it work:</p>
      <ul>
        <li>
          <strong>Quote an all-in per-person figure, not a nightly rate.</strong> &ldquo;Roughly
          $600 each including flights, accommodation and getting around, plus your own food and
          drink.&rdquo; A per-night number hides two thirds of the real cost, and the hiding is
          what produces the late dropouts.
        </li>
        <li>
          <strong>Offer bands rather than a single number.</strong> Ask people to pick a ceiling
          &mdash; under $400, $400 to $700, $700 to $1,000 &mdash; rather than asking &ldquo;is this
          okay?&rdquo;, which almost everybody answers yes to. The band that keeps the most people
          in is your budget.
        </li>
        <li>
          <strong>Let them answer privately.</strong> Nobody wants to be the person announcing to
          the group that they cannot afford the nice option. A private response gets you the truth;
          a group chat gets you polite agreement followed by a withdrawal in week six.
        </li>
      </ul>
      <p>
        If the group splits hard on budget, that is a real answer too. Two smaller trips, or one
        trip with a cheaper accommodation tier, both beat one trip that half the group is quietly
        dreading paying for.
      </p>

      <h2>Eight weeks out: destination, inside the constraints</h2>
      <p>
        Now, and only now, put up a shortlist. Every option must fit the dates and the budget
        already agreed &mdash; if it does not, it is not an option, no matter how much someone
        loves it. Three or four candidates, each with the actual all-in estimate attached, and an
        approval vote: tick everywhere you would be happy to go.
      </p>
      <p>
        Approval rather than favorites matters here. First-choice voting on four destinations in a
        group of eight produces a winner with three votes and five people who feel overruled about
        a trip they are about to spend several hundred dollars on.
      </p>

      <h2>Seven weeks out: the deposit &mdash; where &ldquo;in&rdquo; becomes real</h2>
      <p>
        Nothing about a group trip is real until money moves. Set a single date, ask for a
        meaningful deposit &mdash; enough to hurt slightly, typically a quarter to a third of the
        total &mdash; and state the rule plainly:
      </p>
      <blockquote>
        Whoever has paid the deposit by Sunday is on the trip. I&rsquo;ll book for that number on
        Monday.
      </blockquote>
      <p>
        This single sentence does more work than every reminder you will send. It converts an
        ambiguous social intention into a decision with a date on it, it fixes the headcount before
        you commit to accommodation sized for it, and it makes the eventual per-person cost honest.
      </p>
      <p>
        Be equally clear about what happens afterwards: from this point the price is fixed, and
        somebody dropping out means the rest of the group covers their share unless the place can
        be filled. People accept that rule readily when they are told it in advance and resent it
        enormously when they discover it later.
      </p>

      <h2>Six weeks out: book, and hand out jobs</h2>
      <p>
        Book the accommodation and lock in travel. Prices for anything involving flights start
        moving against you around now, which is the practical reason the whole timeline exists.
      </p>
      <p>
        Then split the ownership. One person cannot hold an eight-person trip in their head without
        becoming resentful, and the most reliable predictor of a badly organized trip is a single
        organizer who never delegated. Four named roles cover almost everything:
      </p>
      <ul>
        <li>
          <strong>Money.</strong> Holds the ledger, collects deposits, settles up at the end.
        </li>
        <li>
          <strong>Accommodation.</strong> Owns the booking, the check-in details, the house rules.
        </li>
        <li>
          <strong>Transport.</strong> Flights or cars, airport runs, getting around once there.
        </li>
        <li>
          <strong>Things to do.</strong> Two or three optional anchors, not a schedule.
        </li>
      </ul>

      <h2>Four weeks out: logistics in one place</h2>
      <p>
        Put everything in a single shared document: address, check-in and check-out times, who
        arrives when and how, the ledger link, emergency contacts, and any hard constraints
        &mdash; allergies, mobility, someone who has to be back by a certain hour on the last day.
      </p>
      <p>
        The point is not thoroughness for its own sake. It is that when six people each hold
        different fragments in different chat threads, every one of those fragments gets asked
        about three times in the week before departure, and all three questions land on you.
      </p>

      <h2>Two weeks out: agree on the shape of the days, not the schedule</h2>
      <p>
        Pick two or three anchors for the whole trip &mdash; the one dinner everybody is at, the
        one excursion, the one thing that needs booking ahead &mdash; and deliberately leave the
        rest empty.
      </p>
      <p>
        Over-planning is the most common way a group trip becomes unpleasant. Eight people do not
        want to do the same thing at the same time for five days, and a full itinerary turns every
        divergence into a negotiation. Say explicitly at the start that splitting up during the day
        is expected and fine; it removes an astonishing amount of low-grade friction.
      </p>

      <h2>The week before</h2>
      <p>
        Confirm arrival times, make sure everyone can actually get in on day one, and remind people
        what they still owe. Post the ledger total once so nobody is surprised at the end.
      </p>
      <p>
        Settle money once, after the trip, from a single shared record &mdash; not continuously
        over five days. Running reconciliation is the fastest way to make a vacation feel like
        admin.
      </p>

      <h2>Compressing it for a weekend</h2>
      <p>
        A two-night trip does not need twelve weeks, but it needs the same order. Four weeks is
        comfortable: dates at four weeks, budget and destination at three, deposit and booking at
        two, logistics in the final week. The steps you can shorten are the gaps between decisions;
        the step you cannot skip is any of the decisions themselves &mdash; and the one people skip
        is always money.
      </p>

      <h2>The whole thing in one list</h2>
      <ol>
        <li>Sound out interest in a trip, with no destination attached.</li>
        <li>Vote on date windows; lock the winner and stop discussing dates.</li>
        <li>Agree a per-person all-in budget band, answered privately.</li>
        <li>Shortlist destinations that fit the dates and the budget; approval-vote them.</li>
        <li>Take deposits by a named date; that is the group.</li>
        <li>Book, and hand out four named jobs.</li>
        <li>One shared document with every detail in it.</li>
        <li>Two or three anchors; leave the rest of the days open.</li>
        <li>Settle up once, afterwards, from one ledger.</li>
      </ol>
    </Article>
  )
}
