"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"
import { GlassSlider } from "../ui/GlassSlider"

export function DayStyleStep() {
  const { data, setField } = useOnboardingStore()

  return (
    <div>
      <StepHeader
        title="¿Cómo es tu día ideal?"
        subtitle="Organizamos las actividades según tu ritmo circadiano"
        emoji="🕐"
      />

      <div className="glass-card p-6 mb-4">
        <p className="text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-4">
          ¿A qué hora empiezas el día?
        </p>
        <GlassSlider
          value={data.wakeTime}
          onChange={(v) => setField("wakeTime", v)}
          leftLabel="Madrugador (7am)"
          rightLabel="Noctámbulo (11am)"
          leftEmoji="☀️"
          rightEmoji="🌙"
          gradient="from-[#ffdb3c] to-[#0A84FF]"
        />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[#e4e2e4]">¿Siesta a mediodía?</p>
            <p className="text-xs text-[#c0c6d6] mt-0.5">Bloqueamos 1-2h tras el almuerzo</p>
          </div>
          <button
            onClick={() => setField("wantsSiesta", !data.wantsSiesta)}
            className={`
              relative w-12 h-6 rounded-full transition-all duration-200
              ${data.wantsSiesta ? "bg-[#0A84FF]" : "bg-white/15"}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200
                ${data.wantsSiesta ? "left-6.5" : "left-0.5"}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
