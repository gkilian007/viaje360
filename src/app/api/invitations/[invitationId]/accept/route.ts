import { NextRequest } from "next/server"
import { normalizeRouteError, successResponse, errorResponse } from "@/lib/api/route-helpers"
import { resolveRequestIdentity, createRouteSupabaseClient } from "@/lib/auth/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Login required", 401)
    }

    const routeSupabase = await createRouteSupabaseClient()
    const authUser = routeSupabase ? (await routeSupabase.auth.getUser()).data.user : null
    const authEmail = authUser?.email?.toLowerCase() ?? null

    if (!authEmail) {
      return errorResponse("UNAUTHORIZED", "Email required", 401)
    }

    const { invitationId } = await params
    const supabase = createServiceClient()

    const { data: invitation } = await supabase
      .from("trip_collaborators")
      .select("id, trip_id, email, accepted, role")
      .eq("id", invitationId)
      .maybeSingle()

    if (!invitation) {
      return errorResponse("NOT_FOUND", "Invitation not found", 404)
    }

    if (String(invitation.email).toLowerCase() !== authEmail) {
      return errorResponse("UNAUTHORIZED", "This invitation belongs to another email", 403)
    }

    const { error: updateError } = await supabase
      .from("trip_collaborators")
      .update({
        accepted: true,
        user_id: identity.userId,
      })
      .eq("id", invitationId)

    if (updateError) {
      return errorResponse("INTERNAL_ERROR", "Failed to accept invitation", 500)
    }

    const { data: trip } = await supabase
      .from("trips")
      .select("id")
      .eq("id", invitation.trip_id)
      .maybeSingle()

    if (!trip) {
      return errorResponse("NOT_FOUND", "Trip not found", 404)
    }

    await supabase
      .from("trips")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", invitation.trip_id)

    return successResponse({
      accepted: true,
      tripId: invitation.trip_id,
      role: invitation.role,
      alreadyAccepted: invitation.accepted === true,
    })
  } catch (error) {
    return normalizeRouteError(error, "Failed to accept invitation")
  }
}
