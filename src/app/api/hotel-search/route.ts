import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "es,en",
  "User-Agent": "Viaje360/1.0 (https://viaje360.app)",
}

export interface HotelResult {
  name: string
  lat: number
  lng: number
  type: string
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "hotel-search", 20, "1 m")
  if (!rl.ok) return rl.response!

  const q = req.nextUrl.searchParams.get("q")
  const destination = req.nextUrl.searchParams.get("destination")

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const query = destination ? `${q}, ${destination}` : q
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "6",
      addressdetails: "1",
    })

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: NOMINATIM_HEADERS,
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    if (!Array.isArray(data)) return NextResponse.json({ results: [] })

    const results: HotelResult[] = data
      .map((item: Record<string, unknown>) => {
        const lat = parseFloat(item.lat as string)
        const lng = parseFloat(item.lon as string)
        if (!isFinite(lat) || !isFinite(lng)) return null
        return {
          name: (item.display_name as string) ?? (item.name as string) ?? q,
          lat,
          lng,
          type: (item.type as string) ?? "place",
        }
      })
      .filter(Boolean) as HotelResult[]

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
