import { NextRequest, NextResponse } from "next/server"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")
  const near = req.nextUrl.searchParams.get("near") // destination city for context
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 })
  }

  const headers = {
    Accept: "application/json",
    "User-Agent": "Viaje360/1.0 (https://viaje360.app)",
  }

  try {
    // Strategy 1: query with destination context appended
    const queryWithContext = near ? `${q}, ${near}` : q
    let result = await searchNominatim(queryWithContext, headers)

    // Strategy 2: if no result with full address+context, try just name + destination
    if (!result && near) {
      // Extract just the place name (before first comma in original query)
      const placeName = q.split(",")[0].trim()
      if (placeName !== q) {
        result = await searchNominatim(`${placeName}, ${near}`, headers)
      }
    }

    // Strategy 3: fallback to original query without context
    if (!result && near) {
      result = await searchNominatim(q, headers)
    }

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ data: null })
  }
}

async function searchNominatim(
  query: string,
  headers: Record<string, string>
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ q: query, format: "json", limit: "1" })
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers,
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
