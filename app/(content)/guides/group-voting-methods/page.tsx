import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "group-voting-methods"

export const metadata = guideMetadata(SLUG)

const BALLOTS: [string, string][] = [
  ["Ana", "Ramen > Tapas > Pizza > Curry"],
  ["Ben", "Ramen > Pizza > Tapas > Curry"],
  ["Cara", "Ramen > Pizza > Tapas > Curry"],
  ["Dev", "Tapas > Curry > Pizza > Ramen"],
  ["Eve", "Tapas > Pizza > Curry > Ramen"],
  ["Finn", "Curry > Pizza > Tapas > Ramen"],
  ["Gia", "Curry > Pizza > Tapas > Ramen"],
  ["Hal", "Pizza > Curry > Tapas > Ramen"],
]

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        Most groups never choose a voting method. They inherit one &mdash; usually
        &ldquo;everybody name your favourite, most names wins&rdquo; &mdash; and then argue about
        the result without noticing that the counting rule, not the group, produced it.
      </p>
      <p>
        That is worth knowing because the choice of rule is not cosmetic. Below is a single set of
        preferences that produces three different winners under three perfectly reasonable methods.
      </p>

      <h2>The example</h2>
      <p>
        Eight friends, four restaurants. Everyone honestly ranks all four, best to worst:
      </p>
      <table>
        <thead>
          <tr>
            <th>Voter</th>
            <th>Ranking</th>
          </tr>
        </thead>
        <tbody>
          {BALLOTS.map(([name, ranking]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{ranking}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Nobody is being strategic and nobody is lying. Now watch what the counting does.
      </p>

      <h2>Plurality: everyone names one favourite</h2>
      <p>
        Count first choices only. Ramen gets Ana, Ben, and Cara &mdash; three. Tapas gets Dev and
        Eve &mdash; two. Curry gets Finn and Gia &mdash; two. Pizza gets Hal &mdash; one.
      </p>
      <p>
        <strong>Ramen wins with three votes out of eight.</strong> Five of the eight ranked it dead
        last.
      </p>
      <p>
        This is plurality&rsquo;s signature failure and it is extremely common in small groups. It
        rewards a committed bloc over a broadly acceptable option, and it gets worse as you add
        options: four similar choices split the vote of everyone who likes that kind of thing,
        handing the win to whichever distinct option has the most concentrated support. The pizza
        camp and the curry camp are, in effect, spoilers for each other.
      </p>
      <p>
        Plurality is fine when there are exactly two options, or when you expect a genuine
        favourite to be obvious. With four options and eight people it is close to a coin flip
        dressed up as a decision.
      </p>

      <h2>Approval: tick everything you are happy with</h2>
      <p>
        Different question &mdash; not <em>which do you prefer</em> but <em>which would you be
        glad to go to</em>. Each person ticks as many as they like. Given the rankings above, a
        natural set of approvals looks like this:
      </p>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Approved by</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pizza</td>
            <td>Ben, Cara, Dev, Eve, Finn, Gia, Hal</td>
            <td>7</td>
          </tr>
          <tr>
            <td>Curry</td>
            <td>Dev, Eve, Finn, Gia, Hal</td>
            <td>5</td>
          </tr>
          <tr>
            <td>Tapas</td>
            <td>Ana, Dev, Eve, Finn</td>
            <td>4</td>
          </tr>
          <tr>
            <td>Ramen</td>
            <td>Ana, Ben, Cara</td>
            <td>3</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Pizza wins with seven of eight.</strong> It was almost nobody&rsquo;s favourite
        &mdash; only Hal put it first &mdash; and it is the option nearly everyone is content with.
      </p>
      <p>
        Approval measures breadth rather than intensity, which is usually what you actually want
        from a group decision. Its weakness is the mirror image: it cannot tell the difference
        between &ldquo;I would love this&rdquo; and &ldquo;fine, I suppose&rdquo;, so an option
        that everyone mildly tolerates can beat one that half the group would be genuinely excited
        about. It is also mildly gameable &mdash; someone who ticks only their favourite gets more
        leverage than someone who ticks three &mdash; though in a group of friends who can see each
        other next week, that tends to sort itself out.
      </p>
      <p>
        For scheduling, approval is not just a good method, it is the correct one. Availability
        genuinely is binary: you can make Thursday or you cannot, and ranking your free evenings by
        enthusiasm answers a question nobody asked.
      </p>

      <h2>Ranked choice: eliminate the weakest, redistribute</h2>
      <p>
        Take the full rankings and run instant-runoff. Pizza has the fewest first choices (Hal
        alone), so Pizza is eliminated and Hal&rsquo;s vote moves to his next surviving option,
        Curry. Standings become Ramen three, Curry three, Tapas two.
      </p>
      <p>
        Tapas is now lowest and drops out. Dev&rsquo;s next choice is Curry; Eve&rsquo;s next is
        Pizza, which is gone, so hers moves along to Curry as well. Final round: Curry five, Ramen
        three.
      </p>
      <p>
        <strong>Curry wins.</strong> Same eight people, same honest preferences, third different
        answer.
      </p>
      <p>
        Ranked choice fixes plurality&rsquo;s spoiler problem and does capture some intensity. It
        costs you two things: filling in a full ranking is real work, which depresses response
        rates, and the outcome depends on elimination order in ways that are hard to explain to
        someone who is annoyed about the result. Notice that Pizza &mdash; the option seven of
        eight were happy with &mdash; was eliminated in the very first round, precisely because it
        was widely liked rather than intensely loved.
      </p>

      <h2>Which one was &ldquo;right&rdquo;?</h2>
      <p>
        There is a reasonable tiebreaker here. Check every option head-to-head against every other
        one. Pizza beats Ramen five to three, beats Tapas five to three, and beats Curry six to
        two. It wins every pairwise contest, which makes it the Condorcet winner &mdash; the option
        a majority prefers to each alternative individually.
      </p>
      <p>
        Approval found it. Plurality and instant-runoff both missed it, in opposite directions. A
        Borda count, where a first place is worth three points, a second two, and a third one,
        also lands on Pizza with fifteen points to Tapas&rsquo;s thirteen, Curry&rsquo;s eleven,
        and Ramen&rsquo;s nine.
      </p>
      <p>
        The lesson is not that approval voting is always correct &mdash; there is a proof, Arrow&rsquo;s
        theorem, that no ranked method can satisfy every property you would want at once. The
        lesson is that for the ordinary case of a small group picking among several acceptable
        options, the plurality rule everyone defaults to is the one most likely to produce a winner
        most people did not want.
      </p>

      <h2>Constraints are not votes</h2>
      <p>
        One thing no counting method handles: hard constraints. If someone cannot eat at the sushi
        place, or genuinely cannot afford the £200 option, that is not a preference to be outvoted.
        It is a filter to apply before the ballot exists.
      </p>
      <p>
        Ask about constraints first and separately &mdash; dietary needs, budget ceiling,
        accessibility, who has a car &mdash; then build the option list out of things that survive
        them. Putting an unworkable option on a ballot and letting the group vote it in produces
        the worst outcome available: a decision that is both legitimate and impossible.
      </p>

      <h2>Practical guidance</h2>
      <ul>
        <li>
          <strong>Scheduling a date or time:</strong> approval. Tick every slot you can make. The
          winner is the widest overlap, which is the only thing you were looking for.
        </li>
        <li>
          <strong>Choosing between a handful of acceptable options</strong> &mdash; restaurant,
          film, activity: approval again, optionally with a &ldquo;first choice&rdquo; marker to
          break ties by enthusiasm.
        </li>
        <li>
          <strong>A big, expensive, one-shot decision</strong> where intensity really matters
          &mdash; the destination for a week-long trip: ranked choice, or approval plus an explicit
          round of discussion. Accept that it costs more of everyone&rsquo;s attention.
        </li>
        <li>
          <strong>Two options:</strong> plurality. It is the same as everything else at that point.
        </li>
      </ul>

      <h2>Announce the rule before you open the vote</h2>
      <p>
        Whichever method you pick, say what it is in the invitation, along with how ties break and
        when voting closes. &ldquo;Tick everything that works; most ticks wins; if two tie I&rsquo;ll
        take the earlier date; closes Thursday 9pm&rdquo; is a complete constitution in one line.
      </p>
      <p>
        Announcing the rule afterwards, or changing it once the results are visible, is the fastest
        way to make a group stop trusting your polls &mdash; and a rule chosen after the fact is
        indistinguishable from picking the winner you wanted.
      </p>
      <p>
        One last thing worth keeping in proportion: turnout beats method. A well-chosen rule
        applied to four responses out of nine is worse than plurality applied to all nine. Get
        everyone to answer first; optimise the counting second.
      </p>
    </Article>
  )
}
