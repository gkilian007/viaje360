import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "es,en",
  "User-Agent": "Viaje360/1.0 (https://viaje360.app)",
}

// Destination city bounding boxes for viewbox-bounded search
// Prevents Nominatim returning results from province instead of city
const CITY_VIEWBOXES: Record<string, string> = {
  toledo: "-4.15,39.82,-3.95,39.92",
  madrid: "-3.85,40.30,-3.55,40.55",
  barcelona: "2.05,41.30,2.25,41.50",
  sevilla: "-6.05,37.30,-5.85,37.45",
  valencia: "-0.45,39.40,-0.30,39.55",
  granada: "-3.65,37.14,-3.55,37.22",
  córdoba: "-4.85,37.86,-4.75,37.92",
  cordoba: "-4.85,37.86,-4.75,37.92",
  bilbao: "-2.98,43.24,-2.88,43.30",
  málaga: "-4.48,36.69,-4.38,36.74",
  malaga: "-4.48,36.69,-4.38,36.74",
  roma: "12.40,41.84,12.56,41.94",
  rome: "12.40,41.84,12.56,41.94",
  paris: "2.26,48.82,2.42,48.92",
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "geocode", 30, "1 m")
  if (!rl.ok) return rl.response!

  const q = req.nextUrl.searchParams.get("q")
  const near = req.nextUrl.searchParams.get("near") // destination city for context
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 })
  }

  try {
    const cityKey = near?.toLowerCase().trim() ?? ""
    const viewbox = CITY_VIEWBOXES[cityKey]

    // Strategy 1: bounded search within city viewbox (most accurate)
    if (viewbox && near) {
      const result = await searchNominatim(`${q}, ${near}`, { viewbox, bounded: "1" })
      if (result) return NextResponse.json({ data: result })
    }

    // Strategy 2: query with destination context + country code
    const queryWithContext = near ? `${q}, ${near}` : q
    let result = await searchNominatim(queryWithContext, {})
    if (result) return NextResponse.json({ data: result })

    // Strategy 3: place name only + destination
    if (near) {
      const placeName = q.split(",")[0].trim()
      if (placeName !== q) {
        result = await searchNominatim(`${placeName}, ${near}`, {})
        if (result) return NextResponse.json({ data: result })
      }
    }

    // Strategy 4: original query alone
    result = await searchNominatim(q, {})
    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ data: null })
  }
}

async function searchNominatim(
  query: string,
  extra: Record<string, string>
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ q: query, format: "json", limit: "1", ...extra })
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: NOMINATIM_HEADERS,
      next: { revalidate: 86400 },
    })

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
