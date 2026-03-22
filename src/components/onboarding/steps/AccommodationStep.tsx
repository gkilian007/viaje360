"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"

export function AccommodationStep() {
  const { data, setField } = useOnboardingStore()

  return (
    <div>
      <StepHeader
        title="¿Dónde te alojas?"
        subtitle="Optimizamos rutas desde tu alojamiento"
        emoji="🏨"
      />

      <div className="glass-pill px-4 py-3 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#0A84FF] text-xl">hotel</span>
        <input
          type="text"
          placeholder="Nombre del hotel o barrio..."
          value={data.accommodationZone}
          onChange={(e) => setField("accommodationZone", e.target.value)}
          className="flex-1 bg-transparent text-[#e4e2e4] placeholder:text-[#c0c6d6]/50 text-sm"
        />
      </div>

      <p className="mt-4 text-xs text-[#c0c6d6]/60 text-center">
        Puedes dejarlo en blanco y añadirlo más tarde
      </p>
    </div>
  )
}
