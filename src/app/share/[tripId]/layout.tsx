import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"

interface ShareLayoutProps {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}

export async function generateMetadata({ params }: ShareLayoutProps): Promise<Metadata> {
  const { tripId } = await params

  try {
    const supabase = createServiceClient()
    const { data: trip } = await supabase
      .from("trips")
      .select("destination, country, start_date, end_date")
      .eq("id", tripId)
      .single()

    if (!trip) {
      return {
        title: "Plan de viaje · Viaje360",
        description: "Descubre este itinerario de viaje creado con Viaje360.",
      }
    }

    const dest = trip.destination ?? "Mi viaje"
    const country = trip.country ? `, ${trip.country}` : ""
    const startYear = trip.start_date ? new Date(trip.start_date).getFullYear() : ""
    const title = `Plan de viaje a ${dest}${country}${startYear ? ` · ${startYear}` : ""} · Viaje360`
    const description = `Descubre el itinerario completo de ${dest}: actividades, rutas y experiencias únicas planificadas con inteligencia artificial.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `https://viaje360.app/share/${tripId}`,
        siteName: "Viaje360",
        images: [
          {
            url: `https://viaje360.app/api/og/recap?destination=${encodeURIComponent(dest)}&country=${encodeURIComponent(trip.country ?? "")}`,
            width: 1200,
            height: 630,
            alt: `Plan de viaje a ${dest} con Viaje360`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          `https://viaje360.app/api/og/recap?destination=${encodeURIComponent(dest)}&country=${encodeURIComponent(trip.country ?? "")}`,
        ],
      },
    }
  } catch {
    return {
      title: "Plan de viaje · Viaje360",
      description: "Itinerario de viaje creado con inteligencia artificial.",
    }
  }
}

export default function ShareLayout({ children }: ShareLayoutProps) {
  return <>{children}</>
}
