import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import ShareTripClient from "./ShareTripClient"

interface Props {
  params: Promise<{ tripId: string }>
}

async function fetchTripMeta(tripId: string) {
  try {
    const supabase = createServiceClient()
    const { data: trip } = await supabase
      .from("trips")
      .select("destination, country, start_date, end_date, image_url")
      .eq("id", tripId)
      .single()

    if (!trip) return null

    const { count } = await supabase
      .from("itinerary_days")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId)

    // Count activities from itinerary_days JSON
    const { data: days } = await supabase
      .from("itinerary_days")
      .select("activities")
      .eq("trip_id", tripId)

    const totalActivities = days?.reduce((acc, d) => {
      const acts = d.activities as unknown[]
      return acc + (Array.isArray(acts) ? acts.length : 0)
    }, 0) ?? 0

    return {
      destination: trip.destination ?? "Viaje",
      country: trip.country ?? "",
      startDate: trip.start_date,
      endDate: trip.end_date,
      imageUrl: trip.image_url,
      totalDays: count ?? 0,
      totalActivities,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tripId } = await params
  const trip = await fetchTripMeta(tripId)

  if (!trip) {
    return {
      title: "Itinerario compartido | Viaje360",
      description: "Planifica tu próximo viaje con inteligencia artificial.",
    }
  }

  const title = `Mi viaje a ${trip.destination} | Viaje360`
  const description = `${trip.totalDays} días, ${trip.totalActivities} actividades — planificado con IA`
  const ogImageUrl = `/api/og/trip?destination=${encodeURIComponent(trip.destination)}&days=${trip.totalDays}&activities=${trip.totalActivities}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://viaje360.app/share/${tripId}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Itinerario de viaje a ${trip.destination}`,
        },
      ],
      siteName: "Viaje360",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ShareTripPage() {
  return <ShareTripClient />
}
