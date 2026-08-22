import { Article, guideMetadata } from "@/components/content/Article"

const SLUG = "group-size-changes-everything"

export const metadata = guideMetadata(SLUG)

export default function Page() {
  return (
    <Article slug={SLUG}>
      <p>
        The way you organized dinner for four does not scale to twelve, and it does not degrade
        gracefully on the way. It works, works, works, and then stops working &mdash; usually
        somewhere around eight people, usually without anyone identifying what changed.
      </p>
      <p>
        What changed is that coordination cost does not rise with group size. It accelerates. Five
        people have ten possible pairs between them; twelve people have sixty-six. Every additional
        person adds not one relationship to manage but a growing number of them, and the methods
        that felt effortless at the low end quietly become impossible.
      </p>

      <h2>Two to four: no process at all</h2>
      <p>
        At this size any structure is overhead. Ask directly, in whatever medium you already use,
        and expect an answer within the day. There is no meaningful difference between a poll and a
        text message, and the poll costs more to set up than it saves.
      </p>
      <p>
        Consensus is genuinely achievable here, and waiting for it is reasonable. If one of four
        people cannot make it, the plan usually should move &mdash; a quarter of the group is a lot
        of the group.
      </p>

      <h2>Five to seven: the last size where everyone can be heard</h2>
      <p>
        This is the sweet spot for group decisions and the largest size at which a single
        conversation stays a single conversation. Everyone can contribute, everyone can be
        individually addressed, and response rates stay high because a message to six people still
        feels like it is partly addressed to you.
      </p>
      <p>What starts to be worth doing here:</p>
      <ul>
        <li>
          <strong>Offer options rather than asking open questions.</strong> Six sets of
          &ldquo;I&rsquo;m free most evenings&rdquo; is already too much to intersect by hand.
        </li>
        <li>
          <strong>Set a deadline.</strong> Not because anyone will miss it, but because it gives
          the decision a shape and stops the thread drifting.
        </li>
        <li>
          <strong>Stop requiring unanimity.</strong> Five of six is a plan. Six of six is luck.
        </li>
      </ul>

      <h2>Eight to twelve: process becomes mandatory</h2>
      <p>
        Several things break at once around eight, which is why the transition feels abrupt.
      </p>
      <p>
        <strong>The conversation splits.</strong> A table of eight is not one conversation; it is
        two or three, and which one you are in is determined by seating. The same fragmentation
        happens in a chat thread &mdash; replies stop being addressed to the group and start being
        addressed to whoever posted two messages ago.
      </p>
      <p>
        <strong>Nobody feels individually asked.</strong> The bystander effect is fully operational
        by eight. Each person&rsquo;s sense that the reply must come from them specifically drops,
        and response rates drop with it &mdash; not proportionally, but noticeably.
      </p>
      <p>
        <strong>Waiting for everyone becomes mathematically hopeless.</strong> This one is worth
        seeing in numbers. Suppose each person independently has a generous ninety percent chance
        of answering by your deadline. The probability that <em>all</em> of them do:
      </p>
      <table>
        <thead>
          <tr>
            <th>Group size</th>
            <th>Chance everyone replies</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>4</td>
            <td>66%</td>
          </tr>
          <tr>
            <td>8</td>
            <td>43%</td>
          </tr>
          <tr>
            <td>12</td>
            <td>28%</td>
          </tr>
        </tbody>
      </table>
      <p>
        Nobody has become less reliable. The group got bigger, and full participation stopped being
        the likely outcome. An organizer who waits for everyone at twelve is waiting for something
        that will not happen roughly three times in four.
      </p>
      <p>
        <strong>Finding a date everyone can make gets dramatically harder.</strong> Same
        arithmetic, worse constants. If each person is free on a given evening seventy percent of
        the time, the chance that one specific evening works for the whole group is about seventeen
        percent at five people, six percent at eight, and one percent at twelve.
      </p>
      <p>
        There are only two responses to that, and you need at least one of them: <strong>offer more
        options</strong>, or <strong>lower the bar from everyone to a quorum</strong>. The second is
        almost always the better answer, because the first has a ceiling &mdash; nobody will fill in
        a nine-option availability grid.
      </p>

      <h3>What to change at this size</h3>
      <ul>
        <li>
          <strong>Name an owner.</strong> Below eight, plans can drift into existence. Above it,
          somebody has to be responsible or nothing closes.
        </li>
        <li>
          <strong>Define the quorum in advance.</strong> &ldquo;If six of us can make it,
          we&rsquo;re going.&rdquo; Say it in the invitation, before you know who the six are.
        </li>
        <li>
          <strong>Use approval voting, not favorites.</strong> First-choice voting across four
          options in a group of ten produces a winner with three votes, which is not a mandate
          anyone feels bound by.
        </li>
        <li>
          <strong>Chase individually, not in the group thread.</strong> Public nudges are noise for
          the people who answered and pressure for the people who did not.
        </li>
        <li>
          <strong>Delegate.</strong> One person cannot hold a twelve-person plan without resenting
          it. Split off money, logistics, and booking as named jobs.
        </li>
      </ul>

      <h2>Thirteen and up: you are running an event, not making a plan</h2>
      <p>
        Past a dozen, trying to accommodate everyone stops being generous and starts being the
        thing that prevents the event from happening. The mental shift is from <em>finding a time
        that works</em> to <em>announcing a time and collecting a headcount</em>.
      </p>
      <p>
        That sounds harsher than it is. In practice it is a relief for everyone: you get a date and
        a place, they get a clear yes-or-no question that takes two seconds, and nobody is holding
        anybody else hostage. The question changes from &ldquo;which of these works for you?&rdquo;
        to &ldquo;can you make this?&rdquo;
      </p>
      <p>
        Pick the date around the people who genuinely must be there &mdash; usually two or three
        &mdash; and then announce it. Everyone else is invited to something real rather than
        consulted about something hypothetical.
      </p>

      <h2>The summary table</h2>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Ask</th>
            <th>Decision rule</th>
            <th>Owner needed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2&ndash;4</td>
            <td>Open question</td>
            <td>Consensus</td>
            <td>No</td>
          </tr>
          <tr>
            <td>5&ndash;7</td>
            <td>3&ndash;5 options</td>
            <td>Majority, with a deadline</td>
            <td>Helpful</td>
          </tr>
          <tr>
            <td>8&ndash;12</td>
            <td>3&ndash;5 options, approval voting</td>
            <td>Stated quorum</td>
            <td>Required, plus delegates</td>
          </tr>
          <tr>
            <td>13+</td>
            <td>Announcement</td>
            <td>RSVP headcount</td>
            <td>Required</td>
          </tr>
        </tbody>
      </table>

      <h2>Shrinking the group is allowed</h2>
      <p>
        The option organizers most often overlook: a group of fourteen that never manages to meet
        is worth less than two groups of seven that meet regularly. Large friend groups usually
        contain a smaller core that actually shows up, and pretending otherwise produces a
        permanent state of almost-planning.
      </p>
      <p>
        Nobody has to be excluded for this to work. Plan around the core, invite everyone, and let
        attendance sort itself out &mdash; which is exactly what a stated quorum does. The
        alternative is a group that is technically inclusive and functionally inert.
      </p>
    </Article>
  )
}
