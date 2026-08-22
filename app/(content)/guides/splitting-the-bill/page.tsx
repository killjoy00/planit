import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "splitting-the-bill"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Money is the thing groups are worst at discussing and quickest to resent. Almost none of
        the damage comes from the amounts. It comes from three decisions nobody makes out loud:
        how the bill gets divided, who fronts it, and when everyone settles up.
      </p>
      <p>
        Make those three explicit and the whole category of problem mostly disappears. Leave them
        implicit and you get the familiar slow rot &mdash; the friend who stops coming to dinners,
        the person who always seems to be owed forty dollars, the group that quietly splits into
        the people who order wine and the people who do not.
      </p>

      <h2>Decide the split before anyone orders</h2>
      <p>
        This is the single highest-leverage change available, and it costs one sentence at the
        start of the meal.
      </p>
      <p>
        &ldquo;Even split at the end?&rdquo; asked <em>before</em> the menus close is a fair
        question. Everyone can hear it, adjust what they order, and object cheaply. The same
        question asked when the check arrives is not a question at all &mdash; it is a bill handed
        to the person who had soup and tap water, and they cannot decline it without looking petty
        in front of seven people.
      </p>
      <p>
        The reason this matters more than it sounds: announcing an even split at the start actually
        changes ordering behavior, and it changes it in a way everyone has consented to. People
        converge on similar price points. The even split then becomes accurate rather than merely
        convenient.
      </p>

      <h2>When to split evenly and when to itemize</h2>
      <p>
        Even splitting is faster, involves no math at the table, and is right most of the time. It
        becomes unfair at a predictable point: when the gap between the biggest and smallest
        individual total is more than about a third of the average. Below that, itemizing costs
        more in awkwardness and arithmetic than it recovers. Above it, someone is subsidizing
        someone else by a margin they will notice and remember.
      </p>
      <p>Some practical middle grounds, roughly in order of how often they are the right call:</p>
      <ul>
        <li>
          <strong>Split food evenly, drinks by consumer.</strong> Alcohol is the single most common
          source of bill resentment, because it is both expensive and unevenly consumed. Two
          ledgers &mdash; one shared, one individual &mdash; solves most of the problem with almost
          no extra effort.
        </li>
        <li>
          <strong>Even split, minus the outliers.</strong> The two people who shared a $90 bottle
          or the one who ordered the market-price fish pay that item themselves; everything else
          divides evenly.
        </li>
        <li>
          <strong>Full itemization.</strong> Reserve it for genuinely lopsided meals, or for groups
          where money is tight enough that precision is a kindness rather than a nuisance.
        </li>
      </ul>
      <p>
        If you itemize, apply tax and tip proportionally to each person&rsquo;s subtotal rather
        than dividing them evenly. Splitting a $60 tip eight ways on a bill where two people ate
        half the food quietly reintroduces the unfairness you just did the work to remove.
      </p>

      <h2>Whoever fronts the money sets the deadline</h2>
      <p>
        One card is faster for the restaurant and much worse for the person holding it, because
        the cost of collecting lands entirely on them. The fix is a rule that travels with the
        card: <strong>whoever pays says, out loud, when they expect to be paid back.</strong>
      </p>
      <blockquote>
        I&rsquo;ve got it &mdash; I&rsquo;ll send everyone their share tonight, if you can settle
        by the weekend.
      </blockquote>
      <p>
        That sentence does three things. It converts an open-ended favor into a dated transaction,
        it gives the fronter permission to follow up later without it feeling like an accusation,
        and it tells everyone the amount is coming so they can stop wondering.
      </p>
      <p>
        Send the amounts the same night. Memory of a meal decays fast, and a request that arrives
        four days later reads as a surprise bill rather than a settlement.
      </p>

      <h2>Settle once, and settle net</h2>
      <p>
        Groups routinely make this harder than it is. Eight people who each owe two other people
        do not need twenty-four transfers. Work out each person&rsquo;s net position &mdash; total
        paid minus total owed &mdash; and move money only between the people who are net negative
        and net positive. For most group weekends that collapses a tangle of small debts into three
        or four transactions.
      </p>
      <p>
        Do it once, at the end, from a single shared record. Running reconciliation during a trip
        &mdash; settling up after each meal, each cab, each round &mdash; is the fastest way to make
        a vacation feel like bookkeeping. Keep one list, add to it as you go, resolve it afterward.
      </p>

      <h2>Round up, and write off the small stuff</h2>
      <p>
        Do not chase $1.75. The social cost of the request exceeds the money by an enormous margin,
        and the person receiving it will remember the asking long after they have forgotten the
        amount. Round to the nearest few dollars in the other person&rsquo;s favor and move on.
      </p>
      <p>
        The same logic applies at the top end, with a longer fuse. If someone has owed you a
        genuinely trivial amount for months, the debt has stopped being about money &mdash; it is
        now a small ongoing irritation you are choosing to keep. Write it off, decide privately
        whether to front for that person again, and let it go. Standing debts between friends are
        corrosive out of all proportion to their size.
      </p>

      <h2>Put the price in the invitation</h2>
      <p>
        Almost every painful money moment in a group is a conversation that should have happened
        before anyone committed. The invitation is where it belongs.
      </p>
      <p>
        &ldquo;Thinking of the tasting menu place &mdash; it&rsquo;s about $85 a head before
        drinks&rdquo; costs you nothing and gives people a graceful exit while declining is still
        free. Without it, the person who cannot afford it finds out at the table, where their only
        options are to overspend or to say so publicly. They will usually overspend, and they will
        usually not come next time.
      </p>
      <p>
        This is also why a poll option should carry its cost inline. &ldquo;Sushi place on
        5th&rdquo; and &ldquo;Sushi place on 5th &mdash; about $50 each&rdquo; get different votes
        from the same people, and only one of them is an informed answer.
      </p>

      <h2>For groups that meet regularly, rotate instead of splitting</h2>
      <p>
        If the same six people have dinner every month, splitting every bill six ways is a lot of
        arithmetic to arrive at roughly where you would have landed anyway. Rotating &mdash; one
        person covers the whole thing each time &mdash; is cheaper socially, evens out over a year,
        and turns a transaction into something closer to hosting.
      </p>
      <p>
        It only works when the spending is genuinely comparable month to month, and when the
        rotation is written down somewhere rather than remembered. It stops working the moment
        someone hosts a $400 evening and the next person in line is looking at a $90 one; at that
        point go back to splitting.
      </p>

      <h2>When someone does not pay</h2>
      <p>
        One private reminder, framed as information rather than accusation: &ldquo;Hey &mdash; the
        dinner thing was $46 if you still need the number.&rdquo; That covers the overwhelming
        majority of cases, because the overwhelming majority are genuine forgetting.
      </p>
      <p>
        If it does not land, stop. Do not send a second reminder, do not raise it in the group
        thread, and do not make it a running joke. Absorb the amount, and simply do not front money
        for that person again &mdash; when the next bill comes, hand them the card reader or ask
        them to pay their part directly. It is a quiet, complete solution that costs the friendship
        nothing, which is more than can be said for the alternative.
      </p>

      <h2>The short version</h2>
      <ol>
        <li>Announce the split method before anyone orders.</li>
        <li>Even split unless the spread is more than about a third; drinks by consumer.</li>
        <li>Tax and tip proportionally if you itemize.</li>
        <li>Whoever fronts names the settlement deadline, out loud, and sends amounts that night.</li>
        <li>Settle once, net, from one shared record.</li>
        <li>Round in the other person&rsquo;s favor; write off the trivial.</li>
        <li>Put the price in the invitation, where declining is still free.</li>
      </ol>
    </Article>
  )
}
