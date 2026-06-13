import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse } from "@/lib/api/route-helpers"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import type { DbActivityKnowledge } from "@/lib/supabase/database.types"

const MAX_RESULTS = 12

interface TravelerSuggestion {
  id: string
  name: string
  category: string
  address: string | null
  imageUrl: string | null
  bookingUrl: string | null
  officialUrl: string | null
  pricePerPerson: number | null
  ticketPrice: number | null
  lat: number | null
  lng: number | null
}

function readImageUrl(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null
  const value = metadata["image_url"]
  return typeof value === "string" && value.length > 0 ? value : null
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "suggestions-travelers", 30, "1 m")
  if (!rl.ok) return rl.response!

  const destination = req.nextUrl.searchParams.get("destination")?.trim()
  if (!destination) {
    return errorResponse("VALIDATION_ERROR", "destination required", 400)
  }

  if (!isSupabaseConfigured()) {
    return successResponse({ activities: [] as TravelerSuggestion[] })
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("activity_knowledge")
      .select(
        "id, canonical_name, category, address, metadata, booking_url, official_url, price_per_person, ticket_price, latitude, longitude"
      )
      .eq("destination", destination)
      .order("updated_at", { ascending: false })
      .limit(40)

    if (error) {
      return errorResponse("BAD_GATEWAY", "Could not load suggestions", 502)
    }

    const rows = (data ?? []) as Array<
      Pick<
        DbActivityKnowledge,
        | "id"
        | "canonical_name"
        | "category"
        | "address"
        | "metadata"
        | "booking_url"
        | "official_url"
        | "price_per_person"
        | "ticket_price"
        | "latitude"
        | "longitude"
      >
    >

    const activities: TravelerSuggestion[] = rows
      .map((row) => ({
        id: String(row.id),
        name: String(row.canonical_name ?? ""),
        category: String(row.category ?? "tour"),
        address: typeof row.address === "string" ? row.address : null,
        imageUrl: readImageUrl(row.metadata),
        bookingUrl: typeof row.booking_url === "string" ? row.booking_url : null,
        officialUrl: typeof row.official_url === "string" ? row.official_url : null,
        pricePerPerson: typeof row.price_per_person === "number" ? row.price_per_person : null,
        ticketPrice: typeof row.ticket_price === "number" ? row.ticket_price : null,
        lat: typeof row.latitude === "number" ? row.latitude : null,
        lng: typeof row.longitude === "number" ? row.longitude : null,
      }))
      .filter((activity) => activity.name.length > 0 && activity.imageUrl !== null)
      .slice(0, MAX_RESULTS)

    return successResponse({ activities })
  } catch {
    return errorResponse("INTERNAL_ERROR", "Could not load suggestions", 500)
  }
}
