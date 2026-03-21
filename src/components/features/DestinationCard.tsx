"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DestinationCardProps {
  name: string
  country: string
  emoji: string
  description: string
  gradient: string
  isActive?: boolean
}

export function DestinationCard({
  name,
  country,
  emoji,
  description,
  gradient,
  isActive = false,
}: DestinationCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
      {/* Gradient header */}
      <div className={`h-28 bg-gradient-to-br ${gradient} flex flex-col justify-between p-3`}>
        <div className="flex justify-between items-start">
          <span className="text-3xl">{emoji}</span>
          {isActive && (
            <Badge className="text-[10px] px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white border-white/30">
              Tu viaje actual
            </Badge>
          )}
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">{name}</p>
          <p className="text-white/80 text-xs">{country}</p>
        </div>
      </div>
      {/* Card footer */}
      <div className="bg-slate-800/80 border border-slate-700/30 border-t-0 rounded-b-2xl p-3">
        <p className="text-slate-400 text-xs line-clamp-2 mb-2">{description}</p>
        <Button size="sm" className="w-full h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-none">
          Explorar
        </Button>
      </div>
    </div>
  )
}
