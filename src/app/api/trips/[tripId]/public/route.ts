import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

interface PublicActivity {
  id: string
  name: string
  type: string
  location: string
  time: string
  endTime?: string
  duration: number
  description?: string
  notes?: string
  emoji?: string
  imageUrl?: string
  lat?: number
  lng?: number
}

interface PublicDay {
  dayNumber: number
  date: string
  activities: PublicActivity[]
}

interface PublicTripResponse {
  id: string
  destination: string
  country: string
  startDate: string
  endDate: string
  days: PublicDay[]
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params

  if (!tripId) {
    return NextResponse.json({ error: "Missing tripId" }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    // Fetch trip — only safe public fields
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, destination, country, start_date, end_date")
      .eq("id", tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Fetch days
    const { data: daysRows, error: daysError } = await supabase
      .from("trip_days")
      .select("id, day_number, date")
      .eq("trip_id", tripId)
      .order("day_number", { ascending: true })

    if (daysError) {
      return NextResponse.json({ error: "Failed to fetch days" }, { status: 500 })
    }

    const days: PublicDay[] = []

    if (daysRows && daysRows.length > 0) {
      const dayIds = daysRows.map((d) => d.id as string)

      const { data: activitiesRows } = await supabase
        .from("activities")
        .select(
          "id, day_id, name, type, location, time, end_time, duration_minutes, description, notes, lat, lng"
        )
        .in("day_id", dayIds)
        .order("time", { ascending: true })

      const activitiesByDayId = new Map<string, PublicActivity[]>()
      for (const row of activitiesRows ?? []) {
        const dayId = row.day_id as string
        if (!activitiesByDayId.has(dayId)) {
          activitiesByDayId.set(dayId, [])
        }
        activitiesByDayId.get(dayId)!.push({
          id: row.id as string,
          name: row.name as string,
          type: row.type as string,
          location: row.location as string,
          time: row.time as string,
          endTime: row.end_time as string | undefined,
          duration: row.duration_minutes as number,
          description: row.description as string | undefined,
          notes: row.notes as string | undefined,
          lat: row.lat as number | undefined,
          lng: row.lng as number | undefined,
        })
      }

      for (const day of daysRows) {
        days.push({
          dayNumber: day.day_number as number,
          date: day.date as string,
          activities: activitiesByDayId.get(day.id as string) ?? [],
        })
      }
    }

    const response: PublicTripResponse = {
      id: trip.id as string,
      destination: trip.destination as string,
      country: trip.country as string,
      startDate: trip.start_date as string,
      endDate: trip.end_date as string,
      days,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (err) {
    console.error("[public trip] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
