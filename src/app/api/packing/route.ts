import { NextRequest, NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { createServiceClient } from "@/lib/supabase/server"
import { generatePackingList } from "@/lib/services/packing.service"
import { getForecast } from "@/lib/services/weather.service"

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return NextResponse.json({ ok: false, error: "Auth required" }, { status: 401 })
    }

    const tripId = req.nextUrl.searchParams.get("tripId")
    if (!tripId) {
      return NextResponse.json({ ok: false, error: "Missing tripId" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Load trip
    const { data: trip } = await supabase
      .from("trips")
      .select("id, destination, country, start_date, end_date")
      .eq("id", tripId)
      .eq("user_id", identity.userId)
      .single()

    if (!trip) {
      return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 })
    }

    // Load saved packing state if exists
    const { data: saved } = await supabase
      .from("packing_lists")
      .select("items")
      .eq("trip_id", tripId)
      .eq("user_id", identity.userId)
      .single()

    // Load itinerary activities
    const { data: versions } = await supabase
      .from("trip_itinerary_versions")
      .select("activities_snapshot")
      .eq("trip_id", tripId)

    const activities = (versions ?? []).flatMap(v => {
      const snapshot = v.activities_snapshot as Array<{ name: string; type?: string }> | null
      return (snapshot ?? []).map(a => ({ name: a.name, type: a.type }))
    })

    // Get weather forecast
    const firstWithCoords = (versions ?? []).flatMap(v => {
      const snapshot = v.activities_snapshot as Array<{ lat?: number; lng?: number }> | null
      return (snapshot ?? []).filter(a => a.lat && a.lng)
    })[0]

    let forecast
    if (firstWithCoords?.lat && firstWithCoords?.lng) {
      try { forecast = await getForecast(firstWithCoords.lat, firstWithCoords.lng) } catch { /* optional */ }
    }

    const totalDays = Math.ceil(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
    ) + 1

    const list = generatePackingList({
      tripId,
      destination: trip.destination ?? "",
      country: trip.country ?? "",
      totalDays,
      activities,
      forecast,
    })

    // Merge saved packed state
    if (saved?.items && typeof saved.items === "object") {
      const packedMap = new Map<string, boolean>()
      for (const item of saved.items as Array<{ id: string; packed: boolean }>) {
        packedMap.set(item.id, item.packed)
      }
      for (const item of list.items) {
        if (packedMap.has(item.id)) {
          item.packed = packedMap.get(item.id) ?? false
        }
      }
    }

    return NextResponse.json({ ok: true, data: list })
  } catch (error) {
    console.error("[packing] GET error:", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return NextResponse.json({ ok: false, error: "Auth required" }, { status: 401 })
    }

    const body = await req.json()
    const { tripId, itemId, packed } = body as { tripId: string; itemId: string; packed: boolean }

    if (!tripId || !itemId || typeof packed !== "boolean") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Load existing packing state
    const { data: existing } = await supabase
      .from("packing_lists")
      .select("items")
      .eq("trip_id", tripId)
      .eq("user_id", identity.userId)
      .single()

    let items: Array<{ id: string; packed: boolean }> = []
    if (existing?.items && Array.isArray(existing.items)) {
      items = existing.items as Array<{ id: string; packed: boolean }>
    }

    // Update or add item
    const idx = items.findIndex(i => i.id === itemId)
    if (idx >= 0) {
      items[idx].packed = packed
    } else {
      items.push({ id: itemId, packed })
    }

    // Upsert
    const { error } = await supabase
      .from("packing_lists")
      .upsert({
        trip_id: tripId,
        user_id: identity.userId,
        items,
        updated_at: new Date().toISOString(),
      }, { onConflict: "trip_id,user_id" })

    if (error) {
      console.error("[packing] PATCH error:", error)
      return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[packing] PATCH error:", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
