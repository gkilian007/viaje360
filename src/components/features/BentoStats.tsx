"use client"

import { useAppStore } from "@/store/useAppStore"
import { XP_PER_LEVEL } from "@/lib/constants"

export function BentoStats() {
  const { user, currentTrip } = useAppStore()
  const xpProgress = (user.xp % XP_PER_LEVEL) / XP_PER_LEVEL
  const budgetProgress = currentTrip ? currentTrip.spent / currentTrip.budget : 0

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Walk time remaining */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-2"
        style={{
          background: "rgba(42, 42, 44, 0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#0A84FF]">directions_walk</span>
          <span className="text-[10px] uppercase tracking-widest text-[#c0c6d6] font-medium">
            A pie
          </span>
        </div>
        <p className="text-[22px] font-bold text-white leading-none">12 min</p>
        <p className="text-[11px] text-[#c0c6d6]">hasta Sagrada Família</p>
      </div>

      {/* XP progress */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-2"
        style={{
          background: "rgba(42, 42, 44, 0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#ffdb3c]"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            stars
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#c0c6d6] font-medium">
            XP Nivel {user.level}
          </span>
        </div>
        <p className="text-[22px] font-bold text-[#ffdb3c] leading-none text-glow-gold">
          {user.xp % XP_PER_LEVEL}
          <span className="text-[13px] text-[#c0c6d6] font-normal">/{XP_PER_LEVEL}</span>
        </p>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${xpProgress * 100}%`,
              background: "linear-gradient(90deg, #ffdb3c, #ff9500)",
            }}
          />
        </div>
      </div>

      {/* Budget */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-2"
        style={{
          background: "rgba(42, 42, 44, 0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#30D158]">payments</span>
          <span className="text-[10px] uppercase tracking-widest text-[#c0c6d6] font-medium">
            Presupuesto
          </span>
        </div>
        <p className="text-[22px] font-bold text-white leading-none">
          €{currentTrip?.spent ?? 0}
        </p>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(budgetProgress * 100, 100)}%`,
              background: budgetProgress > 0.85
                ? "linear-gradient(90deg, #FF9F0A, #FF453A)"
                : "linear-gradient(90deg, #30D158, #34C759)",
            }}
          />
        </div>
        <p className="text-[11px] text-[#c0c6d6]">de €{currentTrip?.budget ?? 0}</p>
      </div>

      {/* Trip days */}
      <div
        className="p-4 rounded-2xl flex flex-col gap-2"
        style={{
          background: "rgba(42, 42, 44, 0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-purple-400">calendar_month</span>
          <span className="text-[10px] uppercase tracking-widest text-[#c0c6d6] font-medium">
            Días
          </span>
        </div>
        <p className="text-[22px] font-bold text-white leading-none">Día 1</p>
        <p className="text-[11px] text-[#c0c6d6]">de 5 en Barcelona</p>
      </div>
    </div>
  )
}
