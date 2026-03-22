"use client"

import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { BottomNav } from "@/components/layout/BottomNav"
import { AchievementOverlay } from "@/components/features/AchievementOverlay"
import { RARITY_COLORS, RARITY_LABELS, XP_PER_LEVEL } from "@/lib/constants"

export default function StatusPage() {
  const { user, achievements, pendingAchievement, setPendingAchievement } = useAppStore()
  const [activeTab, setActiveTab] = useState<"achievements" | "stats">("achievements")

  const xpInLevel = user.xp % XP_PER_LEVEL
  const xpProgress = xpInLevel / XP_PER_LEVEL
  const ringSize = 200
  const stroke = 10
  const radius = (ringSize - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className="flex flex-col h-full overflow-y-auto pb-24"
      style={{ background: "#131315" }}
    >
      {/* Hero: XP ring */}
      <div
        className="flex flex-col items-center pt-12 pb-8 px-6 relative"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(10, 132, 255, 0.12) 0%, transparent 70%)",
        }}
      >
        {/* Greeting */}
        <p className="text-[11px] uppercase tracking-widest text-[#c0c6d6] font-medium mb-6">
          Tu progreso
        </p>

        {/* SVG ring */}
        <div className="relative flex items-center justify-center mb-6">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={stroke}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="url(#xpGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - xpProgress)}
              style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
            <defs>
              <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffdb3c" />
                <stop offset="100%" stopColor="#ff9500" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center content */}
          <div className="absolute flex flex-col items-center gap-1">
            <p className="text-[36px] font-black text-[#ffdb3c] text-glow-gold leading-none">
              {user.xp.toLocaleString()}
            </p>
            <p className="text-[12px] text-[#c0c6d6] font-medium">XP TOTAL</p>
            <div
              className="mt-1 px-3 py-1 rounded-full text-[11px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
            >
              NIVEL {user.level}
            </div>
          </div>
        </div>

        {/* Title + location */}
        <h1 className="text-[22px] font-bold text-white text-center">{user.title}</h1>
        <p className="text-[13px] text-[#c0c6d6] mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          Barcelona, España
        </p>

        {/* XP to next level */}
        <div className="w-full max-w-xs mt-4">
          <div className="flex justify-between text-[11px] text-[#c0c6d6] mb-1.5">
            <span>{xpInLevel} XP</span>
            <span>Nivel {user.level + 1} en {XP_PER_LEVEL - xpInLevel} XP</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${xpProgress * 100}%`,
                background: "linear-gradient(90deg, #ffdb3c, #ff9500)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        {[
          { label: "Viajes", value: user.totalTrips, icon: "flight_takeoff" },
          { label: "Países", value: user.countriesVisited, icon: "public" },
          { label: "Lugares", value: user.monumentsCollected, icon: "place" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-2xl flex flex-col items-center gap-1"
            style={{ background: "rgba(31,31,33,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span
              className="material-symbols-outlined text-[20px] text-[#0A84FF]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              {stat.icon}
            </span>
            <p className="text-[20px] font-bold text-white leading-none">{stat.value}</p>
            <p className="text-[10px] text-[#c0c6d6] uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 px-4 mb-4">
        {(["achievements", "stats"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === tab ? "text-white" : "text-[#c0c6d6]"
            }`}
            style={
              activeTab === tab
                ? { background: "#0A84FF" }
                : { background: "rgba(31,31,33,0.6)", border: "1px solid rgba(255,255,255,0.06)" }
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab === "achievements" ? "Logros" : "Estadísticas"}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      {activeTab === "achievements" && (
        <div className="px-4 flex flex-col gap-3">
          {achievements.map((ach) => {
            const rarity = RARITY_COLORS[ach.rarity]
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:scale-[1.01] transition-all ${
                  ach.unlocked ? rarity.glow : ""
                }`}
                style={{
                  background: ach.unlocked ? "rgba(31,31,33,0.9)" : "rgba(19,19,21,0.6)",
                  border: ach.unlocked
                    ? `1px solid rgba(255,255,255,0.08)`
                    : "1px solid rgba(255,255,255,0.04)",
                  opacity: ach.unlocked ? 1 : 0.5,
                }}
                onClick={() => ach.unlocked && setPendingAchievement(ach)}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${rarity.bg}`}
                  style={{ border: `1px solid` }}
                >
                  <span
                    className={`material-symbols-outlined text-[24px] ${rarity.text}`}
                    style={
                      ach.unlocked
                        ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                        : {}
                    }
                  >
                    {ach.unlocked ? ach.icon : "lock"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-semibold text-white truncate">{ach.name}</p>
                  </div>
                  <p className="text-[12px] text-[#c0c6d6] truncate">{ach.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-medium ${rarity.text}`}>
                      {RARITY_LABELS[ach.rarity]}
                    </span>
                    <span className="text-[10px] text-[#ffdb3c] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                        stars
                      </span>
                      +{ach.xpReward} XP
                    </span>
                  </div>
                </div>
                {ach.unlocked && (
                  <span className="material-symbols-outlined text-[16px] text-[#c0c6d6] shrink-0">
                    chevron_right
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === "stats" && (
        <div className="px-4 flex flex-col gap-3">
          {[
            { label: "Distancia caminada", value: "4.2 km", icon: "directions_walk" },
            { label: "Fotos tomadas", value: "34", icon: "photo_camera" },
            { label: "Palabras en catalán", value: "12", icon: "translate" },
            { label: "Cafés probados", value: "3", icon: "coffee" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "rgba(31,31,33,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(10, 132, 255, 0.12)" }}
              >
                <span
                  className="material-symbols-outlined text-[20px] text-[#0A84FF]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-[13px] text-[#c0c6d6]">{stat.label}</p>
                <p className="text-[18px] font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
      {pendingAchievement && <AchievementOverlay achievement={pendingAchievement} />}
    </div>
  )
}
