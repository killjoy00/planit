import assert from "node:assert/strict"
import test from "node:test"
import {
  APPLICATION_TABLES,
  BASELINE_MIGRATION,
  FEATURE_MARKERS,
  FEATURE_MIGRATION,
  classifyDatabase,
} from "../scripts/vercel-migrate.mjs"

const set = (values) => new Set(values)

test("managed databases deploy pending migrations without resolving history", () => {
  assert.deepEqual(
    classifyDatabase({
      tables: set(["_prisma_migrations", ...APPLICATION_TABLES]),
      featureMarkers: set([]),
    }),
    { state: "managed", migrationsToResolve: [] },
  )
})

test("empty databases run the full migration history", () => {
  assert.deepEqual(
    classifyDatabase({ tables: set([]), featureMarkers: set([]) }),
    { state: "empty", migrationsToResolve: [] },
  )
})

test("legacy db-push databases resolve only the baseline", () => {
  assert.deepEqual(
    classifyDatabase({
      tables: set(APPLICATION_TABLES),
      featureMarkers: set([]),
    }),
    { state: "legacy", migrationsToResolve: [BASELINE_MIGRATION] },
  )
})

test("current db-push databases resolve both existing migrations", () => {
  assert.deepEqual(
    classifyDatabase({
      tables: set(APPLICATION_TABLES),
      featureMarkers: set(FEATURE_MARKERS),
    }),
    {
      state: "current-unmanaged",
      migrationsToResolve: [BASELINE_MIGRATION, FEATURE_MIGRATION],
    },
  )
})

test("partial application schemas fail closed", () => {
  assert.throws(
    () => classifyDatabase({ tables: set(["Poll"]), featureMarkers: set([]) }),
    /unmanaged partial schema/,
  )
})

test("partial feature upgrades fail closed", () => {
  assert.throws(
    () =>
      classifyDatabase({
        tables: set(APPLICATION_TABLES),
        featureMarkers: set([FEATURE_MARKERS[0]]),
      }),
    /partially upgraded schema/,
  )
})
