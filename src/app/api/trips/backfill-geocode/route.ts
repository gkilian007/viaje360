/**
 * POST /api/trips/backfill-geocode
 * Geocodes all activities in the user's active trip that have null lat/lng.
 * Called once on /plan page load for legacy trips.
 */
import { normalizeRouteError, successResponse } from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { backfillTripCoordinates } from "@/lib/services/geocode-backfill.server"
import { createServiceClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function POST() {
  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return successResponse({ updated: 0 })
    }

    const supabase = createServiceClient()

    // Get active trip
    const { data: trip } = await supabase
      .from("trips")
      .select("id")
      .eq("user_id", identity.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!trip) return successResponse({ updated: 0 })

    const result = await backfillTripCoordinates(trip.id as string)
    if (result.total === 0) {
      return successResponse({ updated: 0, message: "No activities need geocoding" })
    }
    return successResponse(result)
  } catch (error) {
    console.error("backfill-geocode error:", error)
    return normalizeRouteError(error, "Failed to geocode activities")
  }
}
