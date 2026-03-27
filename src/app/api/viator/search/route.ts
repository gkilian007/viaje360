import { NextRequest } from "next/server"
import { successResponse, normalizeRouteError } from "@/lib/api/route-helpers"

const VIATOR_API = "https://api.viator.com/partner/products/search"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY ?? ""
const AFFILIATE_ID = process.env.NEXT_PUBLIC_VIATOR_CAMPAIGN ?? ""

export interface ViatorProduct {
  productCode: string
  title: string
  description: string
  price: { fromPrice: number; currencyCode: string }
  rating: number
  reviewCount: number
  duration: string
  thumbnailUrl: string
  bookingUrl: string
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const query = sp.get("q") ?? ""
    const destId = sp.get("destId") ?? ""

    if (!query && !destId) {
      return successResponse({ products: [] })
    }

    if (!VIATOR_API_KEY) {
      return successResponse({ products: [], error: "Viator API not configured" })
    }

    const body: Record<string, unknown> = {
      filtering: { searchTerms: query },
      sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
      pagination: { start: 1, count: 4 },
      currency: "EUR",
    }

    if (destId) {
      body.filtering = { ...body.filtering as object, destination: destId }
    }

    const res = await fetch(VIATOR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "es-ES",
        "exp-api-key": VIATOR_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return successResponse({ products: [] })
    }

    const data = await res.json()
    const products: ViatorProduct[] = (data.products ?? []).map((p: {
      productCode: string
      title: string
      description: string
      pricing?: { summary?: { fromPrice: number }; currency: string }
      reviews?: { combinedAverageRating: number; totalReviews: number }
      duration?: { fixedDurationInMinutes?: number }
      images?: Array<{ variants: Array<{ url: string }> }>
    }) => ({
      productCode: p.productCode,
      title: p.title,
      description: p.description?.slice(0, 120) + "...",
      price: {
        fromPrice: p.pricing?.summary?.fromPrice ?? 0,
        currencyCode: p.pricing?.currency ?? "EUR",
      },
      rating: p.reviews?.combinedAverageRating ?? 0,
      reviewCount: p.reviews?.totalReviews ?? 0,
      duration: p.duration?.fixedDurationInMinutes
        ? `${Math.round(p.duration.fixedDurationInMinutes / 60)}h`
        : "Flexible",
      thumbnailUrl: p.images?.[0]?.variants?.[0]?.url ?? "",
      bookingUrl: `https://www.viator.com/tours/${p.productCode}?pid=P00294513&mcid=42383&medium=api&campaign=${AFFILIATE_ID}`,
    }))

    return successResponse({ products })
  } catch (error) {
    console.error("[viator/search] error:", error)
    return successResponse({ products: [] })
  }
}
