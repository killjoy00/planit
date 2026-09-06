import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"

const databaseTest = process.env.DATABASE_URL ? test : test.skip

async function modules() {
  const [{ db }, ballot, closing, recurring] = await Promise.all([
    import("../lib/db.ts"),
    import("../lib/ballot.ts"),
    import("../lib/poll-closing.ts"),
    import("../lib/recurring-series-core.ts"),
  ])
  return { db, ...ballot, ...closing, ...recurring }
}

async function withUser(run) {
  const { db } = await modules()
  const user = await db.user.create({
    data: { email: `concurrency-${randomUUID()}@example.com` },
  })
  try {
    return await run(db, user)
  } finally {
    await db.user.delete({ where: { id: user.id } })
  }
}

databaseTest("simultaneous single-choice replacements leave exactly one ballot", async () => {
  const { commitBallot } = await modules()
  await withUser(async (db, user) => {
    const poll = await db.poll.create({
      data: {
        title: "Dinner",
        type: "SINGLE_CHOICE",
        creatorId: user.id,
        options: { create: [{ label: "A", order: 0 }, { label: "B", order: 1 }] },
        participants: { create: [{ name: "Pat", email: "pat@example.com" }] },
      },
      include: { options: { orderBy: { order: "asc" } }, participants: true },
    })
    const token = poll.participants[0].token

    await Promise.all([
      commitBallot(token, { optionId: poll.options[0].id }),
      commitBallot(token, { optionId: poll.options[1].id }),
    ])

    const votes = await db.vote.findMany({ where: { participantId: poll.participants[0].id } })
    assert.equal(votes.length, 1)
    assert.ok([poll.options[0].id, poll.options[1].id].includes(votes[0].optionId))
  })
})

databaseTest("a vote racing a close is either counted in the winner or rejected", async () => {
  const { commitBallot, closePollRecord, BallotError } = await modules()
  await withUser(async (db, user) => {
    const poll = await db.poll.create({
      data: {
        title: "Dinner",
        type: "SINGLE_CHOICE",
        creatorId: user.id,
        options: { create: [{ label: "A", order: 0 }, { label: "B", order: 1 }] },
        participants: { create: [{ name: "Pat", email: "pat@example.com" }] },
      },
      include: { options: { orderBy: { order: "asc" } }, participants: true },
    })
    const chosen = poll.options[0]

    const [voteResult, closeResult] = await Promise.allSettled([
      commitBallot(poll.participants[0].token, { optionId: chosen.id }),
      closePollRecord(poll.id),
    ])

    assert.equal(closeResult.status, "fulfilled")
    assert.equal(closeResult.value.closed, true)

    const fresh = await db.poll.findUnique({
      where: { id: poll.id },
      include: { votes: true },
    })
    assert.equal(fresh.status, "CLOSED")

    if (voteResult.status === "fulfilled") {
      assert.equal(fresh.votes.length, 1)
      assert.equal(fresh.winnerId, chosen.id)
    } else {
      assert.ok(voteResult.reason instanceof BallotError)
      assert.equal(voteResult.reason.code, "POLL_CLOSED")
      assert.equal(fresh.votes.length, 0)
      assert.equal(fresh.winnerId, null)
    }
  })
})

databaseTest("concurrent recurring advancement creates one next occurrence", async () => {
  const { materializeNextSeriesPoll } = await modules()
  await withUser(async (db, user) => {
    const series = await db.recurringSeries.create({
      data: { creatorId: user.id, cadence: "MONTHLY", interval: 1 },
    })
    const source = await db.poll.create({
      data: {
        title: "Supper club",
        description: "Monthly dinner",
        type: "DATE_POLL",
        creatorId: user.id,
        seriesId: series.id,
        seriesSequence: 1,
        deadline: new Date("2027-01-28T18:00:00.000Z"),
        finalLocation: "The Corner Tap",
        finalNotes: "Reservation under Alex",
        options: {
          create: [
            { label: "Friday", order: 0, dateValue: new Date("2027-01-31T00:00:00.000Z") },
            { label: "Saturday", order: 1, dateValue: new Date("2027-01-30T00:00:00.000Z") },
          ],
        },
        participants: {
          create: [
            { name: "Active", email: "active@example.com" },
            { name: "Out", email: "out@example.com", optedOut: true },
          ],
        },
      },
    })

    const [first, second] = await Promise.all([
      materializeNextSeriesPoll(source.id),
      materializeNextSeriesPoll(source.id),
    ])

    assert.ok(first)
    assert.ok(second)
    assert.equal(first.poll.id, second.poll.id)
    assert.equal([first.created, second.created].filter(Boolean).length, 1)

    const nextPolls = await db.poll.findMany({
      where: { seriesId: series.id, seriesSequence: 2 },
      include: { options: { orderBy: { order: "asc" } }, participants: true },
    })
    assert.equal(nextPolls.length, 1)
    assert.equal(nextPolls[0].options[0].dateValue.toISOString(), "2027-02-28T00:00:00.000Z")
    assert.equal(nextPolls[0].deadline.toISOString(), "2027-02-28T18:00:00.000Z")
    assert.deepEqual(nextPolls[0].participants.map((participant) => participant.email), ["active@example.com"])
    assert.equal(nextPolls[0].finalLocation, "The Corner Tap")
    assert.equal(nextPolls[0].finalNotes, "Reservation under Alex")
  })
})
