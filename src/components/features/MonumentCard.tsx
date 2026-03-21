"use client"

import { useState } from "react"
import { Lock, X, MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MONUMENT_RARITIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Monument } from "@/lib/types"

const MONUMENT_EMOJIS: Record<string, string> = {
  "mon-1": "🖼️",
  "mon-2": "☀️",
  "mon-3": "🏰",
  "mon-4": "⛪",
  "mon-5": "🗼",
  "mon-6": "🏛️",
}

interface Props {
  monument: Monument
  isCollected: boolean
}

export function MonumentCard({ monument, isCollected }: Props) {
  const [showModal, setShowModal] = useState(false)
  const rarityConfig = MONUMENT_RARITIES[monument.rarity]
  const emoji = MONUMENT_EMOJIS[monument.id] ?? "🏛️"

  return (
    <>
      <button
        onClick={() => isCollected && setShowModal(true)}
        className={cn(
          "rounded-xl overflow-hidden text-left w-full transition-all",
          isCollected
            ? "bg-gradient-to-br from-amber-950/80 to-yellow-900/60 border border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.2)] active:scale-95"
            : "bg-slate-900/60 border border-slate-700/30 opacity-60"
        )}
      >
        {/* Image area */}
        <div className="h-24 flex items-center justify-center relative overflow-hidden">
          {isCollected ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-yellow-800/30" />
              <span className="text-4xl drop-shadow-lg relative z-10">{emoji}</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
            </>
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="text-4xl blur-sm opacity-30">{emoji}</span>
              <Lock className="absolute w-6 h-6 text-slate-500" />
            </div>
          )}
          {/* Rarity badge */}
          <div
            className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10"
            style={{ backgroundColor: rarityConfig.color + "30", color: rarityConfig.color }}
          >
            {rarityConfig.label}
          </div>
          {isCollected && (
            <Star className="absolute top-1.5 left-1.5 w-3.5 h-3.5 text-amber-400 fill-amber-400 z-10" />
          )}
        </div>

        {/* Content */}
        <div className="p-2.5">
          <p className={cn("font-semibold text-xs leading-tight", isCollected ? "text-white" : "text-slate-500")}>
            {monument.name}
          </p>
          <p className="text-slate-500 text-[10px] mt-0.5">{monument.location.split(",")[0]}</p>
          {isCollected ? (
            <Badge variant="warning" className="text-[9px] px-1.5 py-0 mt-1.5">
              +{monument.xpReward} XP
            </Badge>
          ) : (
            <p className="text-slate-600 text-[9px] mt-1.5">Visita para desbloquear</p>
          )}
        </div>
      </button>

      {/* Detail modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-5xl">{emoji}</span>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-white text-xl font-bold">{monument.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 mb-3">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-sm">{monument.location}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{monument.description}</p>
            <div className="flex gap-2 mt-4">
              <Badge
                className="border text-xs"
                style={{
                  backgroundColor: rarityConfig.color + "20",
                  color: rarityConfig.color,
                  borderColor: rarityConfig.color + "40",
                }}
              >
                {rarityConfig.label}
              </Badge>
              <Badge variant="warning" className="text-xs">+{monument.xpReward} XP</Badge>
            </div>
            {monument.collectedAt && (
              <p className="text-slate-500 text-xs mt-3">
                Coleccionado el{" "}
                {new Date(monument.collectedAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
