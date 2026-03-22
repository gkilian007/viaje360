import { NextRequest } from "next/server"
import { placesSearchRequestSchema } from "@/lib/api/contracts"
import {
  errorResponse,
  normalizeRouteError,
  parseJsonBody,
  successResponse,
} from "@/lib/api/route-helpers"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

interface PlaceResult {
  name: string
  type: string
  address: string
  neighborhood: string
  rating?: number
  priceLevel?: string
  notes: string
  kidFriendly: boolean
  petFriendly: boolean
  accessible: boolean
  dietaryOptions: string[]
  openingHours?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req, placesSearchRequestSchema)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return errorResponse("INTERNAL_ERROR", "API key not configured", 500)
    }

    const filters = body.filters ?? {}
    const filterText = [
      filters.kidFriendly ? "kid-friendly" : "",
      filters.petFriendly ? "pet-friendly" : "",
      filters.accessible ? "wheelchair accessible" : "",
      ...(filters.dietary ?? []),
      filters.type ?? "",
    ]
      .filter(Boolean)
      .join(", ")

    const prompt = `You are a travel expert. Find places in ${body.location} matching: "${body.query}".
${filterText ? `Required filters: ${filterText}` : ""}

Return ONLY valid JSON array with 5 results:
[
  {
    "name": "Place name",
    "type": "restaurant|museum|monument|park|shopping|tour|hotel",
    "address": "Full address",
    "neighborhood": "Neighborhood",
    "rating": 4.5,
    "priceLevel": "€|€€|€€€|€€€€",
    "notes": "Brief description and tips",
    "kidFriendly": true,
    "petFriendly": false,
    "accessible": true,
    "dietaryOptions": ["vegetarian", "vegan"],
    "openingHours": "9:00-20:00"
  }
]`

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    })

    if (!res.ok) {
      return errorResponse("BAD_GATEWAY", "Search failed", 502)
    }

    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
    }

    const raw = data.candidates[0]?.content?.parts[0]?.text ?? "[]"
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

    let places: PlaceResult[]
    try {
      places = JSON.parse(cleaned) as PlaceResult[]
    } catch {
      places = []
    }

    return successResponse({ places })
  } catch (error) {
    console.error("places/search error:", error)
    return normalizeRouteError(error, "Failed to search places")
  }
}
