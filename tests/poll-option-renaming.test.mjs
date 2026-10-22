import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"

const databaseTest = process.env.DATABASE_URL ? test : test.skip

async function modules() {
  const [{ db }, rename, ballot] = await Promise.all([
    import("../lib/db.ts"),
    import("../lib/poll-option-renaming.ts"),
    import("../lib/ballot.ts"),
  ])
  return { db, ...rename, ...ballot }
}

async function withPoll(run) {
  const { db } = await modules()
  const creator = await db.user.create({ data: { email: `rename-${randomUUID()}@example.com` } })
  try {
    const poll = await db.poll.create({
      data: {
        title: "Where to eat?",
        type: "SINGLE_CHOICE",
        creatorId: creator.id,
        options: { create: [{ label: "Restarant A", order: 0 }, { label: "Restaurant B", order: 1 }] },
        participants: { create: [{ name: "Pat", email: "pat@example.com" }] },
      },
      include: { options: { orderBy: { order: "asc" } }, participants: true },
    })
    await run({ db, creator, poll })
  } finally {
    await db.user.delete({ where: { id: creator.id } })
  }
}

databaseTest("organizer can rename an option before voting without replacing its ID", async () => {
  const { renamePollOption } = await modules()
  await withPoll(async ({ db, creator, poll }) => {
    const before = poll.options[0]
    const renamed = await renamePollOption(poll.id, creator.id, before.id, "  Restaurant A  ")
    assert.deepEqual(renamed, { id: before.id, label: "Restaurant A" })
    const stored = await db.pollOption.findUniqueOrThrow({ where: { id: before.id } })
    assert.equal(stored.label, "Restaurant A")
    assert.equal(stored.order, before.order)
    assert.equal(stored.dateValue, null)
    assert.equal(stored.endDate, null)
  })
})

databaseTest("stale ballot labels are rejected after a rename, and later renames are locked", async () => {
  const { renamePollOption, commitBallot, BallotError, RenameOptionError } = await modules()
  await withPoll(async ({ creator, poll }) => {
    const [first, second] = poll.options
    const token = poll.participants[0].token
    const knownOptionIds = poll.options.map((option) => option.id)
    const knownOptionLabels = poll.options.map((option) => ({ id: option.id, label: option.label }))
    await renamePollOption(poll.id, creator.id, first.id, "Restaurant A")
    await assert.rejects(
      commitBallot(token, { optionId: first.id, knownOptionIds, knownOptionLabels }),
      (error) => error instanceof BallotError && error.code === "OPTIONS_CHANGED",
    )
    await commitBallot(token, {
      optionId: first.id,
      knownOptionIds,
      knownOptionLabels: [{ id: first.id, label: "Restaurant A" }, { id: second.id, label: second.label }],
    })
    await assert.rejects(
      renamePollOption(poll.id, creator.id, second.id, "Restaurant C"),
      (error) => error instanceof RenameOptionError && error.code === "VOTING_STARTED",
    )
  })
})

databaseTest("non-organizers, foreign options, closed polls, and invalid labels cannot rename", async () => {
  const { renamePollOption, RenameOptionError } = await modules()
  await withPoll(async ({ db, creator, poll }) => {
    const option = poll.options[0]
    const rejected = (code) => (error) => error instanceof RenameOptionError && error.code === code
    await assert.rejects(renamePollOption(poll.id, randomUUID(), option.id, "X"), rejected("NOT_FOUND"))
    await assert.rejects(renamePollOption(poll.id, creator.id, randomUUID(), "X"), rejected("NOT_FOUND"))
    await assert.rejects(renamePollOption(poll.id, creator.id, option.id, "  "), rejected("INVALID_LABEL"))
    await db.poll.update({ where: { id: poll.id }, data: { status: "CLOSED" } })
    await assert.rejects(renamePollOption(poll.id, creator.id, option.id, "X"), rejected("NOT_EDITABLE"))
  })
})

databaseTest("a rename racing a vote cannot mutate an already-voted option", async () => {
  const { renamePollOption, commitBallot, RenameOptionError, BallotError } = await modules()
  await withPoll(async ({ db, creator, poll }) => {
    const option = poll.options[0]
    const knownOptionLabels = poll.options.map((item) => ({ id: item.id, label: item.label }))
    const [rename, vote] = await Promise.allSettled([
      renamePollOption(poll.id, creator.id, option.id, "Restaurant A"),
      commitBallot(poll.participants[0].token, { optionId: option.id, knownOptionLabels }),
    ])
    if (rename.status === "fulfilled") {
      assert.equal(vote.status, "rejected")
      assert.ok(vote.reason instanceof BallotError)
      assert.equal(vote.reason.code, "OPTIONS_CHANGED")
    } else {
      assert.ok(rename.reason instanceof RenameOptionError)
      assert.equal(rename.reason.code, "VOTING_STARTED")
      assert.equal(vote.status, "fulfilled")
    }
    const stored = await db.pollOption.findUniqueOrThrow({ where: { id: option.id } })
    assert.equal(stored.label, rename.status === "fulfilled" ? "Restaurant A" : "Restarant A")
  })
})
