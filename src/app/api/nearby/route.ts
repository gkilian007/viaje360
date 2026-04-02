import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { overpassResultToNearbyPOI } from "@/lib/magic-moment"

const OVERPASS_URL = "https://overpass-api.de/api/interpreter"

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

    const query = buildOverpassQuery(lat, lng, Math.min(radius, 1000))

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
      return successResponse({ pois: [] })
    }

    const data = await res.json()
    const elements: Array<{ lat?: number; center?: { lat: number; lon: number }; lon?: number; tags: Record<string, string> }> =
      data.elements ?? []

    const pois = elements
      .map(el => {
        // Ways have center, nodes have lat/lon directly
        const elLat = el.lat ?? el.center?.lat
        const elLon = el.lon ?? el.center?.lon
        if (!elLat || !elLon) return null
        return overpassResultToNearbyPOI({ lat: elLat, lon: elLon, tags: el.tags }, lat, lng)
      })
      .filter(Boolean)
      // Filter out very generic/unnamed POIs and duplicates
      .filter((poi, idx, arr) =>
        poi && arr.findIndex(p => p?.name === poi.name) === idx
      )
      .slice(0, 15)

    return successResponse({ pois })
  } catch (error) {
    // Overpass is optional — always return empty on failure
    console.error("[nearby] overpass error:", error)
    return successResponse({ pois: [] })
  }
}
