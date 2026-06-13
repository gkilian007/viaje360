import { test } from "node:test"
import assert from "node:assert/strict"

import {
  computeSavingsReport,
  fetchSavingsReport,
  GENERATION_COST_EUR,
  PLACES_QUERY_COST_EUR,
} from "./savings-metrics"

const NOW = new Date("2026-06-13T12:00:00Z")

test("computeSavingsReport with empty inputs returns zeroes", () => {
  const report = computeSavingsReport([], [], [], NOW)

  assert.equal(report.liveGenerations.total, 0)
  assert.equal(report.liveGenerations.reuseRatePct, 0)
  assert.equal(report.historicVersions.reuseRatePct, 0)
  assert.equal(report.placesCache.totalHits, 0)
  assert.equal(report.estimatedSavings.totalEur, 0)
})

test("computeSavingsReport counts live generations by source", () => {
  const report = computeSavingsReport(
    [
      { source_type: "ai", authenticated: true },
      { source_type: "library", authenticated: false },
      { source_type: "library", authenticated: true },
      { source_type: "curated-seed", authenticated: false },
    ],
    [],
    [],
    NOW
  )

  assert.equal(report.liveGenerations.total, 4)
  assert.equal(report.liveGenerations.ai, 1)
  assert.equal(report.liveGenerations.reused, 3)
  assert.equal(report.liveGenerations.reuseRatePct, 75)
  assert.deepEqual(report.liveGenerations.bySource, {
    ai: 1,
    library: 2,
    "curated-seed": 1,
  })
  assert.equal(report.liveGenerations.authenticated, 2)
  assert.equal(report.liveGenerations.anonymous, 2)
})

test("computeSavingsReport derives historic reuse from version sources", () => {
  const report = computeSavingsReport(
    [],
    [
      { source: "generate" },
      { source: "generate" },
      { source: "system" },
      { source: null },
    ],
    [],
    NOW
  )

  assert.equal(report.historicVersions.total, 4)
  assert.equal(report.historicVersions.reused, 1)
  assert.equal(report.historicVersions.generated, 2)
  assert.equal(report.historicVersions.reuseRatePct, 25)
})

test("computeSavingsReport aggregates cache hits and active entries", () => {
  const report = computeSavingsReport(
    [],
    [],
    [
      { hit_count: 5, expires_at: "2026-06-19T00:00:00Z" },
      { hit_count: 2, expires_at: "2026-06-01T00:00:00Z" },
      { hit_count: null, expires_at: null },
    ],
    NOW
  )

  assert.equal(report.placesCache.entries, 3)
  assert.equal(report.placesCache.activeEntries, 1)
  assert.equal(report.placesCache.totalHits, 7)
})

test("computeSavingsReport totals euros without double counting authenticated reuse", () => {
  const report = computeSavingsReport(
    [
      // Authenticated library hit: already covered by historicVersions,
      // must NOT add to the headline total a second time.
      { source_type: "library", authenticated: true },
      // Anonymous library hit: invisible to itinerary_versions, must count.
      { source_type: "library", authenticated: false },
      { source_type: "ai", authenticated: false },
    ],
    [{ source: "system" }, { source: "generate" }],
    [{ hit_count: 10, expires_at: "2026-06-19T00:00:00Z" }],
    NOW
  )

  const expected =
    1 * GENERATION_COST_EUR + // historic reused
    1 * GENERATION_COST_EUR + // anonymous live reused
    10 * PLACES_QUERY_COST_EUR

  assert.equal(report.estimatedSavings.totalEur, Math.round(expected * 100) / 100)
  assert.equal(report.estimatedSavings.fromLiveReuseEur, Math.round(2 * GENERATION_COST_EUR * 100) / 100)
  assert.equal(report.estimatedSavings.fromHistoricReuseEur, Math.round(1 * GENERATION_COST_EUR * 100) / 100)
})

function makeFakeSupabase(data: {
  events?: unknown[]
  versions?: unknown[]
  cache?: unknown[]
  errorTable?: string
}) {
  const result = (table: string, rows: unknown[]) =>
    Promise.resolve(
      data.errorTable === table
        ? { data: null, error: { message: `boom in ${table}` } }
        : { data: rows, error: null }
    )

  return {
    from(table: string) {
      const rows =
        table === "generation_events"
          ? data.events ?? []
          : table === "itinerary_versions"
            ? data.versions ?? []
            : data.cache ?? []

      const promise = result(table, rows)
      return {
        select() {
          return Object.assign(
            Promise.resolve(promise),
            {
              eq() {
                return promise
              },
            }
          )
        },
      }
    },
  }
}

test("fetchSavingsReport queries the three tables and computes the report", async () => {
  const fake = makeFakeSupabase({
    events: [
      { source_type: "library", authenticated: false },
      { source_type: "ai", authenticated: true },
    ],
    versions: [{ source: "system" }, { source: "generate" }],
    cache: [{ hit_count: 3, expires_at: "2026-06-19T00:00:00Z" }],
  })

  const report = await fetchSavingsReport(fake, NOW)

  assert.equal(report.liveGenerations.total, 2)
  assert.equal(report.liveGenerations.reused, 1)
  assert.equal(report.historicVersions.reused, 1)
  assert.equal(report.placesCache.totalHits, 3)
})

test("fetchSavingsReport throws when a query fails", async () => {
  const fake = makeFakeSupabase({ errorTable: "generation_events" })

  await assert.rejects(
    () => fetchSavingsReport(fake, NOW),
    /savings metrics query failed: boom in generation_events/
  )
})
