const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const CACHE = new Map<string, { lat: number; lng: number } | null>()

/**
 * Geocode a place name + destination to lat/lng using Nominatim (free, no API key).
 * Results are cached in-memory per session.
 */
export async function geocode(
  placeName: string,
  destination: string
): Promise<{ lat: number; lng: number } | null> {
  const query = `${placeName}, ${destination}`
  const cacheKey = query.toLowerCase().trim()

  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey) ?? null

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      addressdetails: "0",
    })

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": "Viaje360/1.0 (travel-planning-app)",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      CACHE.set(cacheKey, null)
      return null
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      CACHE.set(cacheKey, null)
      return null
    }

    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    CACHE.set(cacheKey, result)
    return result
  } catch (error) {
    console.error("[geocoding] error:", error)
    CACHE.set(cacheKey, null)
    return null
  }
}

/**
 * Batch geocode multiple places. Serialized with 1s delay between
 * requests to respect Nominatim rate limits.
 */
export async function batchGeocode(
  items: Array<{ name: string; location: string; destination: string }>
): Promise<Map<string, { lat: number; lng: number }>> {
  const results = new Map<string, { lat: number; lng: number }>()

  for (const item of items) {
    const key = `${item.name}|${item.location}`
    const coords = await geocode(`${item.name} ${item.location}`, item.destination)
    if (coords) {
      results.set(key, coords)
    }
    // Nominatim rate limit: max 1 request/second
    await new Promise((resolve) => setTimeout(resolve, 1100))
  }

  return results
}
