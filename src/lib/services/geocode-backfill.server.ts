/**
 * Geocodes activities with null lat/lng for a specific trip and persists
 * the coordinates directly via the service client.
 *
 * Shared by:
 * - POST /api/trips/backfill-geocode (browser-triggered, active trip)
 * - POST /api/itinerary/generate (server-side, via after() with explicit tripId)
 */
import { createServiceClient } from "@/lib/supabase/server"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const HEADERS = {
  Accept: "application/json",
  "Accept-Language": "es,en,it,fr,de,pt",
  "User-Agent": "Viaje360/1.0 (https://viaje360.app)",
}

async function geocodeSingle(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ q: query, format: "json", limit: "1" })
    const res = await fetch(`${NOMINATIM_URL}?${params}`, { headers: HEADERS })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (!isFinite(lat) || !isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

function simplify(name: string): string | null {
  const parts = name.split(/\s+(?:y|e|&|and)\s+/i)
  return parts.length > 1 ? parts[0].trim() : null
}

// Nominatim chokes on parentheticals ("(near 62nd St)") and on full postal
// addresses with the city appended again ("Невский пр. 35, Санкт-Петербург,
// Россия, Saint Petersburg"). Strip the former; only append the destination
// to short place names that lack their own city context.
function locationQuery(location: string, destination: string): string {
  const clean = location.replace(/\s*\([^)]*\)/g, "").trim()
  return clean.includes(",") ? clean : `${clean}, ${destination}`
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export interface BackfillResult {
  updated: number
  total: number
  remaining: number
}

export async function backfillTripCoordinates(
  tripId: string,
  options: { batchSize?: number } = {}
): Promise<BackfillResult> {
  const batchSize = options.batchSize ?? 10
  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from("trips")
    .select("id, destination")
    .eq("id", tripId)
    .maybeSingle()

  if (!trip) return { updated: 0, total: 0, remaining: 0 }

  const destination = String(trip.destination ?? "")

  const { data: activities } = await supabase
    .from("activities")
    .select("id, name, location, latitude, longitude, neighborhood")
    .eq("trip_id", trip.id)
    .or("latitude.is.null,longitude.is.null")
    .limit(80) // reasonable cap

  if (!activities || activities.length === 0) {
    return { updated: 0, total: 0, remaining: 0 }
  }

  console.info(`[backfill-geocode] ${activities.length} activities without coords for trip ${trip.id} (${destination})`)

  const cache = new Map<string, { lat: number; lng: number } | null>()
  let updated = 0

  // Each activity may need up to 3 requests × 1.1s ≈ 3.3s, so the batch size
  // bounds total runtime (default 10 ≈ 40s worst case).
  const batch = activities.slice(0, batchSize)

  for (const act of batch) {
    const location = act.location ?? act.neighborhood ?? ""
    if (!location) continue

    const cacheKey = `${act.name}|${location}|${destination}`.toLowerCase()

    let coords: { lat: number; lng: number } | null
    if (cache.has(cacheKey)) {
      coords = cache.get(cacheKey)!
    } else {
      // Try the cleaned location first (as-is if it's already a full address)
      coords = await geocodeSingle(locationQuery(location, destination))
      if (!coords) await delay(1100)

      // Try name + destination
      if (!coords) {
        coords = await geocodeSingle(`${act.name}, ${destination}`)
        if (!coords) await delay(1100)
      }

      // Try simplified name
      if (!coords) {
        const short = simplify(act.name)
        if (short) {
          coords = await geocodeSingle(`${short}, ${destination}`)
          if (!coords) await delay(1100)
        }
      }

      cache.set(cacheKey, coords)
      if (coords) await delay(1100)
    }

    if (coords) {
      await supabase
        .from("activities")
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq("id", act.id)
      updated++
    }
  }

  const remaining = activities.length - batch.length
  console.info(`[backfill-geocode] updated ${updated}/${batch.length} activities (${remaining} remaining)`)
  return { updated, total: activities.length, remaining }
}
