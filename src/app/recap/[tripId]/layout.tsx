import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"

interface RecapLayoutProps {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}

export async function generateMetadata({ params }: RecapLayoutProps): Promise<Metadata> {
  const { tripId } = await params

  try {
    const supabase = createServiceClient()
    const { data: trip } = await supabase
      .from("trips")
      .select("destination, country, start_date, end_date, name")
      .eq("id", tripId)
      .single()

    if (!trip) {
      return {
        title: "Recap de viaje",
        description: "Descubre este itinerario de viaje creado con Viaje360.",
      }
    }

    const dest = trip.destination ?? "Mi viaje"
    const country = trip.country ? `, ${trip.country}` : ""
    const startYear = trip.start_date ? new Date(trip.start_date).getFullYear() : ""
    // The root layout's title.template already appends "| Viaje360" to the
    // document title, but not to openGraph/twitter titles
    const title = `Mi viaje a ${dest}${country}${startYear ? ` · ${startYear}` : ""}`
    const socialTitle = `${title} · Viaje360`
    const description = `Descubre el itinerario completo de ${dest}: actividades, experiencias y momentos únicos planificados con inteligencia artificial.`

    return {
      title,
      description,
      openGraph: {
        title: socialTitle,
        description,
        type: "article",
        url: `https://viaje360.app/recap/${tripId}`,
        siteName: "Viaje360",
        images: [
          {
            url: `https://viaje360.app/api/og/recap?destination=${encodeURIComponent(dest)}&country=${encodeURIComponent(trip.country ?? "")}`,
            width: 1200,
            height: 630,
            alt: `Viaje a ${dest} con Viaje360`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: socialTitle,
        description,
        images: [`https://viaje360.app/api/og/recap?destination=${encodeURIComponent(dest)}&country=${encodeURIComponent(trip.country ?? "")}`],
      },
    }
  } catch {
    return {
      title: "Recap de viaje",
      description: "Itinerario de viaje creado con inteligencia artificial.",
    }
  }
}

export default function RecapLayout({ children }: RecapLayoutProps) {
  return <>{children}</>
}
