import { NextRequest, NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { recordActivityEvent } from "@/lib/services/trip-learning.db"

interface ActivityBookingBody {
  tripId: string
  activityId: string
  booked: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActivityBookingBody

    if (!body.tripId || !body.activityId || typeof body.booked !== "boolean") {
      return NextResponse.json(
        { ok: false, message: "Missing required fields: tripId, activityId, booked" },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, persisted: false })
    }

    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from("activities")
      .update({ booked: body.booked })
      .eq("id", body.activityId)
      .eq("trip_id", body.tripId)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    await recordActivityEvent({
      tripId: body.tripId,
      activityId: body.activityId,
      userId: identity.userId,
      eventType: body.booked ? "activity_booked" : "activity_unbooked",
      eventValue: body.booked ? "booked" : "unbooked",
      metadata: { source: "activity-booking" },
    })

    return NextResponse.json({ ok: true, persisted: true })
  } catch (error) {
    console.error("[activity-booking] Error:", error)
    return NextResponse.json({ ok: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
