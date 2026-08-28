import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import pg from "pg"

const { Client } = pg
const require = createRequire(import.meta.url)

export const BASELINE_MIGRATION = "20260827000000_baseline"
export const FEATURE_MIGRATION = "20260827010000_planning_upgrades"

export const APPLICATION_TABLES = [
  "Account",
  "Session",
  "VerificationToken",
  "User",
  "Group",
  "GroupMember",
  "Poll",
  "PollOption",
  "Participant",
  "Vote",
  "JoinRequest",
  "SignInAttempt",
  "EmailSuppression",
]

export const FEATURE_MARKERS = [
  "column:Poll.timeZone",
  "column:Participant.resultSentAt",
  "column:Participant.resultError",
  "column:Vote.preference",
  "column:SignInAttempt.purpose",
  "column:SignInAttempt.scope",
  "enum:PollType.TIME_POLL",
  "enum:VotePreference.IDEAL",
  "enum:VotePreference.AVAILABLE",
  "enum:EmailSendPurpose.SIGN_IN",
  "enum:EmailSendPurpose.JOIN",
  "index:SignInAttempt_purpose_email_createdAt_idx",
  "index:SignInAttempt_purpose_ip_createdAt_idx",
  "index:SignInAttempt_purpose_scope_createdAt_idx",
]

export function classifyDatabase({ tables, featureMarkers }) {
  if (tables.has("_prisma_migrations")) {
    return { state: "managed", migrationsToResolve: [] }
  }

  const applicationTables = APPLICATION_TABLES.filter((table) => tables.has(table))
  if (applicationTables.length === 0) {
    return { state: "empty", migrationsToResolve: [] }
  }

  if (applicationTables.length !== APPLICATION_TABLES.length) {
    const missing = APPLICATION_TABLES.filter((table) => !tables.has(table))
    throw new Error(
      `Refusing to migrate an unmanaged partial schema. Missing tables: ${missing.join(", ")}`,
    )
  }

  const presentFeatures = FEATURE_MARKERS.filter((marker) => featureMarkers.has(marker))
  if (presentFeatures.length === 0) {
    return { state: "legacy", migrationsToResolve: [BASELINE_MIGRATION] }
  }

  if (presentFeatures.length === FEATURE_MARKERS.length) {
    return {
      state: "current-unmanaged",
      migrationsToResolve: [BASELINE_MIGRATION, FEATURE_MIGRATION],
    }
  }

  const missing = FEATURE_MARKERS.filter((marker) => !featureMarkers.has(marker))
  throw new Error(
    `Refusing to migrate a partially upgraded schema. Missing markers: ${missing.join(", ")}`,
  )
}

function runPrisma(args) {
  const prismaCli = require.resolve("prisma/build/index.js")
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    env: process.env,
    stdio: "inherit",
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`Prisma ${args.join(" ")} exited with status ${result.status}`)
  }
}

async function inspectDatabase(client) {
  const [tableResult, columnResult, enumResult, indexResult] = await Promise.all([
    client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    ),
    client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'`,
    ),
    client.query(
      `SELECT type.typname AS type_name, value.enumlabel AS enum_value
       FROM pg_type AS type
       JOIN pg_enum AS value ON value.enumtypid = type.oid
       JOIN pg_namespace AS namespace ON namespace.oid = type.typnamespace
       WHERE namespace.nspname = 'public'`,
    ),
    client.query(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = 'public'`,
    ),
  ])

  const tables = new Set(tableResult.rows.map((row) => row.table_name))
  const featureMarkers = new Set([
    ...columnResult.rows.map((row) => `column:${row.table_name}.${row.column_name}`),
    ...enumResult.rows.map((row) => `enum:${row.type_name}.${row.enum_value}`),
    ...indexResult.rows.map((row) => `index:${row.indexname}`),
  ])

  return classifyDatabase({ tables, featureMarkers })
}

export async function migrateProductionDatabase() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Skipping database migrations outside the Vercel production environment.")
    return
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for a production deployment.")
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    // Serialize the bootstrap check as well as Prisma's migration commands.
    // The lock belongs to this connection and remains held while Prisma uses
    // its own connection to update the same database.
    await client.query("SELECT pg_advisory_lock(hashtext('planit'), hashtext('schema-migrations'))")

    const database = await inspectDatabase(client)
    console.log(`Production database state: ${database.state}`)

    for (const migration of database.migrationsToResolve) {
      runPrisma(["migrate", "resolve", "--applied", migration])
    }

    runPrisma(["migrate", "deploy"])
  } finally {
    await client
      .query("SELECT pg_advisory_unlock(hashtext('planit'), hashtext('schema-migrations'))")
      .catch(() => undefined)
    await client.end()
  }
}

const isEntryPoint = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isEntryPoint) {
  migrateProductionDatabase().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
