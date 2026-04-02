import type { Metadata } from "next"
import { cache } from "react"
import { createServiceClient } from "@/lib/supabase/server"

interface ShareLayoutProps {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}

interface TripSeoData {
  destination: string
  country: string | null
  start_date: string | null
  end_date: string | null
  days: number
  activities: number
}

const fetchTripSeoData = cache(async (tripId: string): Promise<TripSeoData | null> => {
  try {
    const supabase = createServiceClient()

    const { data: trip } = await supabase
      .from("trips")
      .select("destination, country, start_date, end_date")
      .eq("id", tripId)
      .single()

    if (!trip) return null

    const { data: versions } = await supabase
      .from("trip_itinerary_versions")
      .select("activities_snapshot")
      .eq("trip_id", tripId)

    const days = versions?.length ?? 0
    const activities =
      versions?.reduce((acc, v) => {
        const acts = v.activities_snapshot as unknown[]
        return acc + (Array.isArray(acts) ? acts.length : 0)
      }, 0) ?? 0

    return {
      destination: trip.destination ?? "Mi viaje",
      country: trip.country ?? null,
      start_date: trip.start_date ?? null,
      end_date: trip.end_date ?? null,
      days,
      activities,
    }
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: ShareLayoutProps): Promise<Metadata> {
  const { tripId } = await params
  const trip = await fetchTripSeoData(tripId)

  if (!trip) {
    return {
      title: "Plan de viaje | Viaje360",
      description: "Descubre este itinerario de viaje creado con Viaje360.",
    }
  }

  const dest = trip.destination
  const title = `Mi viaje a ${dest} | Viaje360`
  const description = `${trip.days} días, ${trip.activities} actividades — planificado con IA`
  const ogImageUrl = `https://viaje360.app/api/og/recap?destination=${encodeURIComponent(dest)}&country=${encodeURIComponent(trip.country ?? "")}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://viaje360.app/share/${tripId}`,
      siteName: "Viaje360",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Mi viaje a ${dest} con Viaje360` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://viaje360.app/share/${tripId}`,
    },
  }
}

export default async function ShareLayout({ children, params }: ShareLayoutProps) {
  const { tripId } = await params
  const trip = await fetchTripSeoData(tripId)

  const jsonLd = trip
    ? {
        "@context": "https://schema.org",
        "@type": "TravelAction",
        name: `Viaje a ${trip.destination}`,
        description: `${trip.days} días, ${trip.activities} actividades en ${trip.destination}`,
        location: {
          "@type": "Place",
          name: trip.destination,
          ...(trip.country ? { addressCountry: trip.country } : {}),
        },
        ...(trip.start_date ? { startTime: trip.start_date } : {}),
        ...(trip.end_date ? { endTime: trip.end_date } : {}),
        agent: {
          "@type": "Organization",
          name: "Viaje360",
          url: "https://viaje360.app",
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
