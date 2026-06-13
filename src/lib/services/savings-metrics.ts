/**
 * Savings metrics: how often Viaje360 avoids paid API calls by reusing
 * library itineraries and cached places, and what that saves in euros.
 *
 * Two distinct windows, reported separately on purpose:
 * - liveGenerations: from generation_events, which only accrues data from the
 *   moment the instrumentation deployed (covers guests AND logged-in users).
 * - historicVersions: derived from itinerary_versions.source on the initial
 *   version of each trip ('system' = reused, 'generate' = AI). Covers the full
 *   history but ONLY logged-in users (guest generations never create versions).
 */

// Cost assumptions, documented so the panel can show them honestly.
// A full itinerary generation with gemini-2.5-flash uses roughly 6-10k input
// + 8-12k output tokens; at current pricing (~$0.15/M in, ~$0.60/M out) that
// is ~$0.007-0.009, plus geocoding/asset side calls. We round to a
// conservative all-in estimate per avoided generation.
export const GENERATION_COST_EUR = 0.01
// A places search served from places_cache avoids one Gemini places call
// (smaller prompt than a full itinerary).
export const PLACES_QUERY_COST_EUR = 0.003

export interface GenerationEventRow {
  source_type: string
  authenticated: boolean
}

export interface VersionSourceRow {
  source: string | null
}

export interface CacheEntryRow {
  hit_count: number | null
  expires_at: string | null
}

export interface SavingsReport {
  liveGenerations: {
    total: number
    ai: number
    reused: number
    reuseRatePct: number
    bySource: Record<string, number>
    authenticated: number
    anonymous: number
  }
  historicVersions: {
    total: number
    reused: number
    generated: number
    reuseRatePct: number
  }
  placesCache: {
    entries: number
    activeEntries: number
    totalHits: number
  }
  estimatedSavings: {
    generationCostEur: number
    placesQueryCostEur: number
    fromLiveReuseEur: number
    fromHistoricReuseEur: number
    fromPlacesCacheEur: number
    totalEur: number
    note: string
  }
}

function pct(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 1000) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeSavingsReport(
  events: GenerationEventRow[],
  versionSources: VersionSourceRow[],
  cacheEntries: CacheEntryRow[],
  now: Date
): SavingsReport {
  const bySource: Record<string, number> = {}
  let authenticated = 0
  for (const e of events) {
    bySource[e.source_type] = (bySource[e.source_type] ?? 0) + 1
    if (e.authenticated) authenticated++
  }
  const liveTotal = events.length
  const liveAi = bySource["ai"] ?? 0
  const liveReused = liveTotal - liveAi

  const historicTotal = versionSources.length
  const historicReused = versionSources.filter((v) => v.source === "system").length
  const historicGenerated = versionSources.filter((v) => v.source === "generate").length

  const totalHits = cacheEntries.reduce((sum, c) => sum + (c.hit_count ?? 0), 0)
  const activeEntries = cacheEntries.filter(
    (c) => c.expires_at !== null && new Date(c.expires_at) > now
  ).length

  const fromLiveReuseEur = round2(liveReused * GENERATION_COST_EUR)
  const fromHistoricReuseEur = round2(historicReused * GENERATION_COST_EUR)
  const fromPlacesCacheEur = round2(totalHits * PLACES_QUERY_COST_EUR)

  return {
    liveGenerations: {
      total: liveTotal,
      ai: liveAi,
      reused: liveReused,
      reuseRatePct: pct(liveReused, liveTotal),
      bySource,
      authenticated,
      anonymous: liveTotal - authenticated,
    },
    historicVersions: {
      total: historicTotal,
      reused: historicReused,
      generated: historicGenerated,
      reuseRatePct: pct(historicReused, historicTotal),
    },
    placesCache: {
      entries: cacheEntries.length,
      activeEntries,
      totalHits,
    },
    estimatedSavings: {
      generationCostEur: GENERATION_COST_EUR,
      placesQueryCostEur: PLACES_QUERY_COST_EUR,
      fromLiveReuseEur,
      fromHistoricReuseEur,
      fromPlacesCacheEur,
      // Live and historic windows overlap for logged-in users from the deploy
      // date onward, so they must not be summed blindly. The headline total
      // uses historic reuse (full history) + live ANONYMOUS reuse (invisible
      // to itinerary_versions) + cache hits.
      totalEur: round2(
        fromHistoricReuseEur +
          events.filter((e) => !e.authenticated && e.source_type !== "ai").length *
            GENERATION_COST_EUR +
          totalHits * PLACES_QUERY_COST_EUR
      ),
      note: "Estimación con costes supuestos por llamada; ver constantes en savings-metrics.ts",
    },
  }
}

// Minimal structural client; the real SupabaseClient's generics blow up
// tsc's instantiation depth when matched against this, so call sites cast.
export interface SavingsQueryClient {
  from(table: string): {
    select(columns: string): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> & {
      eq(column: string, value: unknown): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
    }
  }
}

export async function fetchSavingsReport(
  supabase: SavingsQueryClient,
  now: Date = new Date()
): Promise<SavingsReport> {
  const [eventsRes, versionsRes, cacheRes] = await Promise.all([
    supabase.from("generation_events").select("source_type, authenticated"),
    supabase.from("itinerary_versions").select("source").eq("version_number", 1),
    supabase.from("places_cache").select("hit_count, expires_at"),
  ])

  for (const res of [eventsRes, versionsRes, cacheRes]) {
    if (res.error) {
      throw new Error(`savings metrics query failed: ${res.error.message}`)
    }
  }

  return computeSavingsReport(
    (eventsRes.data ?? []) as GenerationEventRow[],
    (versionsRes.data ?? []) as VersionSourceRow[],
    (cacheRes.data ?? []) as CacheEntryRow[],
    now
  )
}
