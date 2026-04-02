import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Viaje360 — Tu viaje perfecto, diseñado por IA",
  description:
    "Itinerarios personalizados que se adaptan en tiempo real a ti, al clima y al momento. Gratis los primeros 2 días.",
  openGraph: {
    title: "Viaje360 — Tu viaje perfecto, diseñado por IA",
    description:
      "Itinerarios personalizados que se adaptan en tiempo real a ti, al clima y al momento. Gratis los primeros 2 días.",
    type: "website",
    url: "https://viaje360.app",
    siteName: "Viaje360",
    locale: "es_ES",
    images: [
      {
        url: "https://viaje360.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Viaje360 — Planificador de viajes con IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Viaje360 — Tu viaje perfecto, diseñado por IA",
    description: "Itinerarios personalizados con IA. Gratis los primeros 2 días.",
    images: ["https://viaje360.app/og-image.png"],
  },
  alternates: {
    canonical: "https://viaje360.app",
  },
  keywords: [
    "planificador de viajes",
    "itinerario con IA",
    "viajes con inteligencia artificial",
    "planificar viaje online",
    "app de viajes gratis",
  ],
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Clean layout — no BottomNav, no TopAppBar
  return <>{children}</>
}
