import { createServiceClient } from "@/lib/supabase/server"

/**
 * Lightweight cache layer backed by Supabase tables.
 * TTL: places = 7 days.
 */

export function placesCacheKey(
  location: string,
  query: string,
  filters?: Record<string, unknown>
): string {
  const filterStr = filters ? JSON.stringify(filters, Object.keys(filters).sort()) : ""
  return `places:${location.toLowerCase().trim()}:${query.toLowerCase().trim()}:${filterStr}`
}

export async function getPlacesFromCache(cacheKey: string): Promise<unknown[] | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("places_cache")
      .select("results")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !data) return null

    // Count the hit for savings metrics — never block or fail the read.
    supabase
      .rpc("increment_places_cache_hit", { p_cache_key: cacheKey })
      .then(({ error: rpcError }) => {
        if (rpcError) console.warn("[getPlacesFromCache] hit count error:", rpcError.message)
      })

    return Array.isArray(data.results) ? (data.results as unknown[]) : null
  } catch {
    return null
  }
}

export async function setPlacesCache(
  cacheKey: string,
  location: string,
  query: string,
  results: unknown[],
  provider: string
): Promise<void> {
  try {
    const supabase = createServiceClient()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from("places_cache").upsert(
      {
        cache_key: cacheKey,
        location,
        query,
        results,
        provider,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" }
    )

    if (error) {
      console.warn("[setPlacesCache] Failed to write cache:", error.message)
    }
  } catch (err) {
    console.warn("[setPlacesCache] Failed to write cache:", err)
  }
}
