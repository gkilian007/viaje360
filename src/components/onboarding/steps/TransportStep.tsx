"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"
import { ChipSelector } from "../ui/ChipSelector"
import type { Transport } from "@/lib/onboarding-types"

const chips: { id: Transport; label: string; emoji: string }[] = [
  { id: "pie", label: "A pie", emoji: "🚶" },
  { id: "publico", label: "Transporte público", emoji: "🚇" },
  { id: "taxi", label: "Taxi / Uber", emoji: "🚕" },
  { id: "coche", label: "Coche propio", emoji: "🚗" },
  { id: "bici", label: "Bicicleta", emoji: "🚲" },
  { id: "mix", label: "Mix de todo", emoji: "🔀" },
]

export function TransportStep() {
  const { data, setField } = useOnboardingStore()

  const handleToggle = (id: string) => {
    const current = data.transport
    if (current.includes(id as Transport)) {
      setField("transport", current.filter((t) => t !== id))
    } else {
      setField("transport", [...current, id as Transport])
    }
  }

  return (
    <div>
      <StepHeader
        title="¿Cómo te mueves?"
        subtitle="Optimizamos rutas según tu medio de transporte preferido"
        emoji="🗺️"
      />
      <ChipSelector
        chips={chips}
        selected={data.transport}
        onToggle={handleToggle}
      />
    </div>
  )
}
