import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Precios — Viaje360",
  description:
    "Planes flexibles para cada viajero. 2 días gratis al llegar a tu destino, luego elige entre pagar por destino o suscripción anual.",
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
