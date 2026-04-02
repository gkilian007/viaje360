import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tu plan de viaje | Viaje360",
  description:
    "Gestiona tu itinerario personalizado en tiempo real. Actividades, mapa, diario y adaptaciones con IA.",
  robots: { index: false, follow: false },
}

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
