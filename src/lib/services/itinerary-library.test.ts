import test from "node:test"
import assert from "node:assert/strict"

import { findReusableItinerary } from "@/lib/services/itinerary-library"
import { defaultOnboardingData, type OnboardingData } from "@/lib/onboarding-types"

type LibraryClient = NonNullable<NonNullable<Parameters<typeof findReusableItinerary>[1]>["client"]>

function makeFakeSupabase(opts: {
  scopedRows?: unknown[]
  globalRows?: unknown[]
  onboardingRows?: unknown[]
}) {
  const calls = {
    orFilters: [] as string[],
    referencedTables: [] as (string | undefined)[],
    globalScans: 0,
    onboardingIds: [] as string[][],
  }

  const supabase = {
    from(table: string) {
      if (table === "itinerary_versions") {
        return {
          select: () => ({
            or: (filter: string, options?: { referencedTable?: string }) => {
              calls.orFilters.push(filter)
              calls.referencedTables.push(options?.referencedTable)
              return {
                order: () => ({
                  limit: async () => ({ data: opts.scopedRows ?? [], error: null }),
                }),
              }
            },
            order: () => ({
              limit: async () => {
                calls.globalScans += 1
                return { data: opts.globalRows ?? [], error: null }
              },
            }),
          }),
        }
      }
      if (table === "onboarding_profiles") {
        return {
          select: () => ({
            in: async (_column: string, ids: string[]) => {
              calls.onboardingIds.push(ids)
              return { data: opts.onboardingRows ?? [], error: null }
            },
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  }

  return { supabase: supabase as unknown as LibraryClient, calls }
}

function makeInput(overrides: Partial<OnboardingData>): OnboardingData {
  return {
    ...defaultOnboardingData,
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    companion: "pareja",
    ...overrides,
  }
}

function makeVersionRow(opts: { id: string; tripId: string; destination: string; onboardingId?: string | null; dayCount?: number }) {
  const days = Array.from({ length: opts.dayCount ?? 3 }, (_, index) => ({
    date: `2026-05-${String(10 + index).padStart(2, "0")}`,
  }))
  return {
    id: opts.id,
    trip_id: opts.tripId,
    snapshot: { days },
    trips: { destination: opts.destination, onboarding_id: opts.onboardingId ?? null },
  }
}

function makeProfile(id: string) {
  return {
    id,
    destination: "Madrid",
    companion: "pareja",
    group_size: 2,
    kids_pets: [],
    mobility: null,
    interests: [],
    traveler_style: null,
    budget_level: null,
    transport: [],
    first_time: null,
  }
}

test("returns a library match from the destination-scoped query", async () => {
  const { supabase, calls } = makeFakeSupabase({
    scopedRows: [makeVersionRow({ id: "ver-1", tripId: "trip-1", destination: "Madrid", onboardingId: "ob-1" })],
    onboardingRows: [makeProfile("ob-1")],
  })

  const match = await findReusableItinerary(makeInput({ destination: "Madrid" }), { client: supabase })

  assert.ok(match, "expected a match from the version library")
  assert.equal(match.sourceTripId, "trip-1")
  assert.equal(match.sourceVersionId, "ver-1")
  assert.equal(match.sourceType, undefined, "expected a DB match, not a curated seed")
  assert.ok(match.score >= 72)
  assert.equal(match.itinerary.days[0]?.date, "2026-07-01")
  assert.equal(match.itinerary.days[2]?.date, "2026-07-03")
  assert.equal(calls.orFilters.length, 1)
  assert.ok(calls.orFilters[0].includes('destination.ilike."madrid"'))
  assert.equal(calls.referencedTables[0], "trips")
  assert.equal(calls.globalScans, 0, "scoped hit must not trigger the global rescan")
  assert.deepEqual(calls.onboardingIds[0], ["ob-1"])
})

test("falls back to the global recent scan when the scoped query is empty", async () => {
  const { supabase, calls } = makeFakeSupabase({
    scopedRows: [],
    globalRows: [makeVersionRow({ id: "ver-2", tripId: "trip-paris", destination: "París", onboardingId: "ob-2" })],
    onboardingRows: [{ ...makeProfile("ob-2"), destination: "París" }],
  })

  const match = await findReusableItinerary(makeInput({ destination: "Paris" }), { client: supabase })

  assert.ok(match, "expected the accented stored destination to match via the global rescan")
  assert.equal(match.sourceTripId, "trip-paris")
  assert.equal(match.sourceType, undefined)
  assert.equal(calls.globalScans, 1)
})

test("scoped filter includes alias variants", async () => {
  const { supabase, calls } = makeFakeSupabase({ scopedRows: [], globalRows: [] })

  await findReusableItinerary(makeInput({ destination: "NYC" }), { client: supabase })

  assert.equal(calls.orFilters.length, 1)
  const filter = calls.orFilters[0]
  assert.ok(filter.includes('destination.ilike."nyc"'))
  assert.ok(filter.includes('destination.ilike."nueva york"'))
  assert.ok(filter.includes('destination.ilike."new york"'))
})

test("returns null when candidates score below the threshold and no curated seed exists", async () => {
  const { supabase, calls } = makeFakeSupabase({
    // 5-day snapshot vs 3 requested days and no onboarding profile: 50 + 5 = 55 < 72.
    scopedRows: [makeVersionRow({ id: "ver-3", tripId: "trip-sev", destination: "Sevilla", dayCount: 5 })],
  })

  const match = await findReusableItinerary(makeInput({ destination: "Sevilla" }), { client: supabase })

  assert.equal(match, null)
  assert.equal(calls.globalScans, 0, "scoped rows existed, so no global rescan")
})
