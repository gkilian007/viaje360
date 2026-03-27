"use client"

import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"
import type { ArrivalTime } from "@/lib/onboarding-types"

const timeChips: { id: ArrivalTime; label: string; emoji: string }[] = [
  { id: "morning", label: "Mañana", emoji: "🌅" },
  { id: "afternoon", label: "Tarde", emoji: "☀️" },
  { id: "evening", label: "Noche", emoji: "🌆" },
  { id: "night", label: "Madrugada", emoji: "🌙" },
]

export function CoreDestinationStep() {
  const { data, setField } = useOnboardingStore()

  return (
    <div>
      <StepHeader
        title="¿A dónde vas?"
        subtitle="Destino, fechas y tamaño del grupo"
        emoji="✈️"
      />

      <div className="space-y-5">
        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
            Destino
          </label>
          <div className="glass-pill px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0A84FF] text-xl">location_on</span>
            <input
              type="text"
              placeholder="Ciudad, país o región..."
              value={data.destination}
              onChange={(e) => setField("destination", e.target.value)}
              className="flex-1 bg-transparent text-[#e4e2e4] placeholder:text-[#c0c6d6]/50 text-sm"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
              Llegada
            </label>
            <div className="glass-panel px-4 py-3">
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className="w-full bg-transparent text-[#e4e2e4] text-sm [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
              Salida
            </label>
            <div className="glass-panel px-4 py-3">
              <input
                type="date"
                value={data.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className="w-full bg-transparent text-[#e4e2e4] text-sm [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Group size */}
        <div>
          <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
            ¿Cuántas personas?
          </label>
          <div className="glass-panel p-4 flex items-center justify-between">
            <button
              onClick={() => setField("groupSize", Math.max(1, data.groupSize - 1))}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#e4e2e4] hover:bg-white/20 transition-colors text-xl font-light"
            >
              −
            </button>
            <div className="text-center">
              <span className="text-2xl font-bold text-[#e4e2e4]">{data.groupSize}</span>
              <p className="text-xs text-[#c0c6d6] mt-0.5">
                {data.groupSize === 1 ? "viajero" : "viajeros"}
              </p>
            </div>
            <button
              onClick={() => setField("groupSize", Math.min(20, data.groupSize + 1))}
              className="w-10 h-10 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] hover:bg-[#0A84FF]/30 transition-colors text-xl"
            >
              +
            </button>
          </div>
        </div>

        {/* Optional arrival time */}
        <div>
          <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
            Hora de llegada <span className="text-white/30 normal-case font-normal">(opcional)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {timeChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setField("arrivalTime", data.arrivalTime === chip.id ? null : chip.id)}
                className={`
                  px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                  ${data.arrivalTime === chip.id
                    ? "border-[#0A84FF] bg-[#0A84FF]/15 text-[#0A84FF]"
                    : "border-white/8 bg-[rgba(31,31,33,0.9)] text-[#c0c6d6] hover:border-white/20"
                  }
                `}
              >
                {chip.emoji} {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
