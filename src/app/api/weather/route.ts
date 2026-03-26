import { NextRequest, NextResponse } from "next/server"
import { getForecast } from "@/lib/services/weather.service"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const lat = parseFloat(sp.get("lat") ?? "")
  const lng = parseFloat(sp.get("lng") ?? "")

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ ok: false, error: "Missing lat/lng" }, { status: 400 })
  }

  const forecast = await getForecast(lat, lng)
  return NextResponse.json({ ok: true, data: forecast })
}
