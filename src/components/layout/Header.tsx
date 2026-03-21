"use client"

import { Bell, Star, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/store/useAppStore"

export default function Header() {
  const user = useAppStore((s) => s.user)

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <span className="text-white font-bold text-xs">V3</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Viaje360</span>
      </div>

      {/* Right section: level + xp + bell */}
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <Badge variant="level" className="flex items-center gap-1 text-xs px-2 py-1">
          <Star className="w-3 h-3" />
          <span>Nivel {user.level}</span>
        </Badge>

        {/* XP Points */}
        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 text-xs font-semibold">
            {user.xp.toLocaleString()} pts
          </span>
        </div>

        {/* Notification Bell */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
          <Bell className="w-4 h-4 text-slate-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>
      </div>
    </header>
  )
}
