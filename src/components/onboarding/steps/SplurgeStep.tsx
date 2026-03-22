"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"
import { ChipSelector } from "../ui/ChipSelector"
import type { SplurgeCategory } from "@/lib/onboarding-types"

const chips: { id: SplurgeCategory; label: string; emoji: string }[] = [
  { id: "comida", label: "Comida y restaurantes", emoji: "🍽️" },
  { id: "experiencias", label: "Experiencias y tours", emoji: "🎭" },
  { id: "shopping", label: "Shopping y souvenirs", emoji: "🛍️" },
  { id: "alojamiento", label: "Alojamiento", emoji: "🏨" },
  { id: "nightlife", label: "Nightlife", emoji: "🍹" },
]

export function SplurgeStep() {
  const { data, setField } = useOnboardingStore()

  const handleToggle = (id: string) => {
    const current = data.splurge
    if (current.includes(id as SplurgeCategory)) {
      setField("splurge", current.filter((s) => s !== id))
    } else {
      setField("splurge", [...current, id as SplurgeCategory])
    }
  }

  return (
    <div>
      <StepHeader
        title="¿En qué te gusta gastar más?"
        subtitle="Priorizamos donde más disfrutas"
        emoji="🎯"
      />
      <ChipSelector
        chips={chips}
        selected={data.splurge}
        onToggle={handleToggle}
      />
    </div>
  )
}
