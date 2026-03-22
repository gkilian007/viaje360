import { NextRequest } from "next/server"
import { weatherQuerySchema } from "@/lib/api/contracts"
import {
  normalizeRouteError,
  parseSearchParams,
  successResponse,
} from "@/lib/api/route-helpers"
import { getCurrentWeather, getForecast } from "@/lib/services/weather.service"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = parseSearchParams(searchParams, weatherQuerySchema)

    const [current, forecast] = await Promise.all([
      getCurrentWeather(query.lat, query.lng),
      getForecast(query.lat, query.lng, query.days),
    ])

    return successResponse({ current, forecast })
  } catch (error) {
    console.error("weather API error:", error)
    return normalizeRouteError(error, "Failed to fetch weather")
  }
}
