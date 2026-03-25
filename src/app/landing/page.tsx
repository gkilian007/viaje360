import ParallaxHero from "@/components/ParallaxHero"

export const metadata = {
  title: "Viaje360 — Tu viaje perfecto, planificado por IA",
  description: "Itinerarios personalizados con inteligencia artificial que se adaptan a ti en tiempo real.",
}

export default function LandingPage() {
  return (
    <main className="bg-[#0a0a1a] min-h-screen overflow-x-hidden">
      <ParallaxHero />
    </main>
  )
}
