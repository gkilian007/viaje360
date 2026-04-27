import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse } from "@/lib/api/route-helpers"
import { getEnv } from "@/lib/env"
import { overpassResultToNearbyPOI } from "@/lib/magic-moment"

const OVERPASS_URL = "https://overpass-api.de/api/interpreter"
const OPENTRIPMAP_URL = "https://api.opentripmap.com/0.1/en/places/radius"

// POI types to query — focused on "magical" spontaneous stops
const OVERPASS_QUERY_TYPES = [
  `node["amenity"~"cafe|bar|restaurant|ice_cream|marketplace"](around:{r},{lat},{lng});`,
  `node["tourism"~"museum|gallery|viewpoint|artwork"](around:{r},{lat},{lng});`,
  `node["historic"~"monument|ruins|castle|memorial"](around:{r},{lat},{lng});`,
  `node["leisure"~"park|garden"](around:{r},{lat},{lng});`,
  `way["leisure"~"park|garden"](around:{r},{lat},{lng});`,
]

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  const parts = OVERPASS_QUERY_TYPES.map(t =>
    t.replace("{lat}", String(lat)).replace("{lng}", String(lng)).replace("{r}", String(radiusMeters))
  )
  return `[out:json][timeout:8];\n(\n  ${parts.join("\n  ")}\n);\nout body center 20;`
}

interface NearbyPOIResponse {
  name: string
  type: string
  lat: number
  lng: number
  distanceMeters: number
  mapsUrl: string
  emoji: string
  durationMinutes: number
  openNow: boolean
}

interface OpenTripMapPlace {
  xid?: string
  name?: string
  kinds?: string
  dist?: number
  point?: { lat?: number; lon?: number }
}

function mapOpenTripMapKind(kinds: string): { type: string; emoji: string; durationMinutes: number } {
  const lower = kinds.toLowerCase()

  if (lower.includes("museums") || lower.includes("cultural")) {
    return { type: "arte", emoji: "🏛️", durationMinutes: 60 }
  }
  if (lower.includes("interesting_places") || lower.includes("historic") || lower.includes("architecture")) {
    return { type: "historia", emoji: "🏺", durationMinutes: 25 }
  }
  if (lower.includes("view_points") || lower.includes("panoramic")) {
    return { type: "fotografia", emoji: "🌆", durationMinutes: 20 }
  }
  if (lower.includes("gardens_and_parks") || lower.includes("natural")) {
    return { type: "naturaleza", emoji: "🌳", durationMinutes: 30 }
  }
  if (lower.includes("foods") || lower.includes("restaurants") || lower.includes("cafes")) {
    return { type: "gastronomia", emoji: "🍽️", durationMinutes: 35 }
  }

  return { type: "cultural", emoji: "📍", durationMinutes: 20 }
}

async function fetchOpenTripMapPOIs(lat: number, lng: number, radiusMeters: number): Promise<NearbyPOIResponse[]> {
  const apiKey = getEnv("OPENTRIPMAP_API_KEY")
  if (!apiKey) return []

  const params = new URLSearchParams({
    radius: String(Math.min(radiusMeters, 1000)),
    lon: String(lng),
    lat: String(lat),
    rate: "2",
    limit: "20",
    format: "json",
    kinds: "interesting_places,cultural,natural,museums,architecture,historic,view_points,gardens_and_parks,foods",
    apikey: apiKey,
  })

  const res = await fetch(`${OPENTRIPMAP_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "Viaje360/1.0 (https://viaje360.app)",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return []

  const data = (await res.json()) as OpenTripMapPlace[]
  if (!Array.isArray(data)) return []

  return data
    .filter((place) => place.name && place.name.trim().length >= 3 && place.point?.lat != null && place.point?.lon != null)
    .map((place) => {
      const mapped = mapOpenTripMapKind(place.kinds ?? "")
      return {
        name: place.name!.trim(),
        type: mapped.type,
        lat: place.point!.lat!,
        lng: place.point!.lon!,
        distanceMeters: Math.round(place.dist ?? 0),
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.point!.lat!},${place.point!.lon!}`,
        emoji: mapped.emoji,
        durationMinutes: mapped.durationMinutes,
        openNow: true,
      }
    })
    .filter((poi, idx, arr) => arr.findIndex((p) => p.name === poi.name) === idx)
    .slice(0, 15)
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "nearby", 30, "1 m")
  if (!rl.ok) return rl.response!

  try {
    const sp = req.nextUrl.searchParams
    const lat = parseFloat(sp.get("lat") ?? "")
    const lng = parseFloat(sp.get("lng") ?? "")
    const radius = parseInt(sp.get("radius") ?? "600")

    if (isNaN(lat) || isNaN(lng)) {
      return errorResponse("VALIDATION_ERROR", "lat and lng required", 400)
    }

    const normalizedRadius = Math.min(radius, 1000)

    const openTripMapPois = await fetchOpenTripMapPOIs(lat, lng, normalizedRadius)
    if (openTripMapPois.length > 0) {
      return successResponse({ pois: openTripMapPois, provider: "opentripmap" })
    }

    const query = buildOverpassQuery(lat, lng, normalizedRadius)

    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Viaje360/1.0 (https://viaje360.app)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return successResponse({ pois: [], provider: "none" })
    }

    const data = await res.json()
    const elements: Array<{ lat?: number; center?: { lat: number; lon: number }; lon?: number; tags: Record<string, string> }> =
      data.elements ?? []

    const pois = elements
      .map(el => {
        const elLat = el.lat ?? el.center?.lat
        const elLon = el.lon ?? el.center?.lon
        if (!elLat || !elLon) return null
        return overpassResultToNearbyPOI({ lat: elLat, lon: elLon, tags: el.tags }, lat, lng)
      })
      .filter(Boolean)
      .filter((poi, idx, arr) =>
        poi && arr.findIndex(p => p?.name === poi.name) === idx
      )
      .slice(0, 15)

    return successResponse({ pois, provider: "overpass" })
  } catch (error) {
    // Overpass is optional — always return empty on failure
    console.error("[nearby] overpass error:", error)
    return successResponse({ pois: [] })
  }
}
