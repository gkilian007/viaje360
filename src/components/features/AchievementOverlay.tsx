"use client"

import type { Achievement } from "@/lib/types"
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/constants"
import { useAppStore } from "@/store/useAppStore"

interface AchievementOverlayProps {
  achievement: Achievement
}

export function AchievementOverlay({ achievement }: AchievementOverlayProps) {
  const { setPendingAchievement } = useAppStore()
  const rarity = RARITY_COLORS[achievement.rarity]

  // SVG ring
  const size = 160
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
      onClick={() => setPendingAchievement(null)}
    >
      <div
        className={`relative flex flex-col items-center gap-6 p-8 rounded-[2rem] max-w-sm w-full ${rarity.glow}`}
        style={{
          background: "rgba(19, 19, 21, 0.95)",
          border: `1px solid rgba(255,255,255,0.1)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti dots */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${(i * 8.5) % 100}%`,
                top: `${(i * 13) % 80}%`,
                background: i % 3 === 0 ? "#ffdb3c" : i % 3 === 1 ? "#0A84FF" : "#30D158",
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* XP ring SVG */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={achievement.rarity === "legendary" ? "#ffdb3c" : "#0A84FF"}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.15}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          {/* Center icon */}
          <div className="absolute flex flex-col items-center gap-1">
            <span
              className={`material-symbols-outlined text-[36px] ${rarity.text}`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
            >
              {achievement.icon}
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-widest text-[#c0c6d6] mb-1">
            Logro Desbloqueado
          </p>
          <h2 className="text-[22px] font-bold text-white">{achievement.name}</h2>
          <p className="text-[13px] text-[#c0c6d6] mt-1">{achievement.description}</p>
          {achievement.location && (
            <p className="text-[12px] text-[#c0c6d6] mt-1 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {achievement.location}
            </p>
          )}
        </div>

        {/* Rarity + XP */}
        <div className="flex items-center gap-3">
          <span
            className={`text-[11px] px-3 py-1 rounded-full font-semibold uppercase tracking-wide ${rarity.text} ${rarity.bg} border ${rarity.border}`}
          >
            {RARITY_LABELS[achievement.rarity]}
          </span>
          <span
            className="text-[13px] font-bold text-[#ffdb3c] text-glow-gold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
              stars
            </span>
            +{achievement.xpReward} XP
          </span>
        </div>

        {/* CTA button */}
        <button
          className="w-full py-4 rounded-2xl font-semibold text-white text-[15px] transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #0A84FF, #5856D6)",
            boxShadow: "0 8px 32px rgba(10, 132, 255, 0.3)",
          }}
          onClick={() => setPendingAchievement(null)}
        >
          Continuar Viaje
        </button>
      </div>
    </div>
  )
}
