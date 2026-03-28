import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explorar destinos — Viaje360",
  description:
    "Descubre destinos populares, gemas ocultas y estilos de viaje. Planifica tu próxima aventura con IA.",
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
