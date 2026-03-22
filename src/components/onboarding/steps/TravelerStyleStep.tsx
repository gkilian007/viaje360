"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"
import { SelectionCard } from "../ui/SelectionCard"
import type { TravelerStyle } from "@/lib/onboarding-types"

const styles: { id: TravelerStyle; emoji: string; label: string; sublabel: string }[] = [
  { id: "instagrammer", emoji: "📸", label: "Instagrammer", sublabel: "Los spots más fotogénicos" },
  { id: "experiencial", emoji: "🍷", label: "Experiencial", sublabel: "Vivir como un local" },
  { id: "explorador", emoji: "🧭", label: "Explorador", sublabel: "Lo oculto y auténtico" },
  { id: "cultural", emoji: "📚", label: "Cultural", sublabel: "Historia y aprendizaje" },
]

export function TravelerStyleStep() {
  const { data, setField } = useOnboardingStore()

  return (
    <div>
      <StepHeader
        title="¿Cómo eres como viajero?"
        subtitle="Tu estilo define el tipo de experiencias que te recomendamos"
        emoji="🗺️"
      />

      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => (
          <SelectionCard
            key={style.id}
            emoji={style.emoji}
            label={style.label}
            sublabel={style.sublabel}
            selected={data.travelerStyle === style.id}
            onSelect={() => setField("travelerStyle", style.id)}
          />
        ))}
      </div>
    </div>
  )
}
