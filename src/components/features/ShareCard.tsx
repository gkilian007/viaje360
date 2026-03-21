"use client"

import { useState } from "react"
import { X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserStats {
  name: string
  level: number
  trips: number
  monuments: number
  countries: number
}

interface Props {
  stats: UserStats
  topMonuments: { name: string; emoji: string }[]
  onClose: () => void
}

const PLATFORMS = [
  { name: "Instagram", emoji: "📸", color: "from-purple-500 to-pink-500" },
  { name: "Twitter/X", emoji: "🐦", color: "from-slate-700 to-slate-800" },
  { name: "Facebook", emoji: "👤", color: "from-blue-600 to-blue-700" },
]

export function ShareCard({ stats, topMonuments, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const initials = stats.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Share preview */}
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-5 border border-blue-500/30 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
              <div>
                <p className="text-white font-bold">{stats.name}</p>
                <Badge variant="level" className="text-[10px]">
                  Nivel {stats.level} Explorador
                </Badge>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: stats.trips, label: "Viajes" },
              { value: stats.monuments, label: "Monumentos" },
              { value: stats.countries, label: "Países" },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/10 rounded-lg py-2.5">
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-slate-300 text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-slate-300 text-xs mb-2">Top monumentos</p>
            <div className="flex gap-2 flex-wrap">
              {topMonuments.map((m) => (
                <div key={m.name} className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
                  <span className="text-sm">{m.emoji}</span>
                  <span className="text-white text-xs">{m.name.split(" ").slice(0, 2).join(" ")}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-[10px] mt-3 text-right">viaje360.app</p>
        </div>

        {/* Actions */}
        <Button className="w-full mb-3 gap-2" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "¡Enlace copiado!" : "Copiar enlace"}
        </Button>

        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.name}
              className={cn(
                "rounded-xl py-3 flex flex-col items-center gap-1.5 bg-gradient-to-br text-white text-xs font-medium",
                p.color
              )}
              onClick={() => alert("¡Próximamente!")}
            >
              <span className="text-xl">{p.emoji}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
