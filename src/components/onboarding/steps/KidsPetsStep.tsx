"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"
import { ChipSelector } from "../ui/ChipSelector"
import type { KidsPets } from "@/lib/onboarding-types"

const chips = [
  { id: "bebe", label: "Bebé (0-2 años)", emoji: "👶" },
  { id: "ninos", label: "Niños (3-10 años)", emoji: "🧒" },
  { id: "pre-adolescentes", label: "Pre-adolescentes (10+)", emoji: "🧑" },
  { id: "perro-pequeno", label: "Perro pequeño", emoji: "🐕" },
  { id: "perro-grande", label: "Perro grande", emoji: "🐕‍🦺" },
  { id: "otro-animal", label: "Otro animal", emoji: "🐱" },
  { id: "ninguno", label: "Ninguno", emoji: "❌" },
]

export function KidsPetsStep() {
  const { data, setField } = useOnboardingStore()

  const handleToggle = (id: string) => {
    const current = data.kidsPets
    if (id === "ninguno") {
      setField("kidsPets", ["ninguno"] as KidsPets[])
      return
    }
    const filtered: KidsPets[] = current.filter((k) => k !== "ninguno") as KidsPets[]
    const typedId = id as KidsPets
    if (filtered.includes(typedId)) {
      setField("kidsPets", filtered.filter((k) => k !== typedId))
    } else {
      setField("kidsPets", [...filtered, typedId])
    }
  }

  return (
    <div>
      <StepHeader
        title="¿Viajáis con niños o mascotas?"
        subtitle="Adaptamos paradas, restaurantes y rutas"
        emoji="👨‍👩‍👧"
      />
      <ChipSelector
        chips={chips}
        selected={data.kidsPets}
        onToggle={handleToggle}
      />
    </div>
  )
}
