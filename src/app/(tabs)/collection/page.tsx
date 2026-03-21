"use client"

import { Target, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/useAppStore"
import { MonumentCard } from "@/components/features/MonumentCard"
import { TrophyCard } from "@/components/features/TrophyCard"

const TOTAL_MONUMENTS = 50
const XP_TO_NEXT = 3000

const ALL_TROPHIES = [
  {
    id: "t1",
    name: "Explorador de Madrid",
    description: "Visita 5 lugares en Madrid",
    emoji: "🏆",
    isUnlocked: true,
  },
  {
    id: "t2",
    name: "Amante del Arte",
    description: "Visita 3 museos",
    emoji: "🥇",
    isUnlocked: true,
  },
  {
    id: "t3",
    name: "Viajero Europeo",
    description: "Visita 5 países",
    emoji: "🌍",
    isUnlocked: false,
    progress: { current: 3, total: 5 },
  },
]

const FRIENDS = [
  { name: "María López", monuments: 12, emoji: "👩" },
  { name: "Juan Pérez", monuments: 8, emoji: "👨" },
  { name: "Sofía García", monuments: 5, emoji: "👧" },
]

const RANK_MEDALS = ["🥇", "🥈", "🥉"]

export default function CollectionPage() {
  const { monuments, user } = useAppStore()

  const collected = monuments.filter((m) => m.collected)
  const locked = monuments.filter((m) => !m.collected)
  const xpPercent = Math.min(Math.round((user.xp / XP_TO_NEXT) * 100), 100)
  const unlockedCount = ALL_TROPHIES.filter((t) => t.isUnlocked).length

  return (
    <div className="flex flex-col gap-5 p-4 pb-6">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Mi Colección</h1>
          <p className="text-slate-400 text-sm">
            {collected.length}/{TOTAL_MONUMENTS} monumentos
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/30 border border-amber-500/30 flex items-center justify-center">
          <span className="text-2xl">🏛️</span>
        </div>
      </div>

      {/* Level progress bar */}
      <Card className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 border-purple-500/30">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">
                Nivel {user.level} Explorador
              </span>
            </div>
            <span className="text-slate-400 text-xs">→ Nivel {user.level + 1}</span>
          </div>
          <Progress value={xpPercent} className="h-2.5" />
          <div className="flex justify-between text-xs">
            <span className="text-purple-300">XP: {user.xp.toLocaleString()}</span>
            <span className="text-slate-500">{XP_TO_NEXT.toLocaleString()} XP</span>
          </div>
        </CardContent>
      </Card>

      {/* Daily challenge */}
      <Card className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-emerald-500/30">
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-emerald-300 text-xs font-medium">Reto de hoy</p>
            <p className="text-white text-sm font-semibold">Visita un museo</p>
          </div>
          <Badge variant="success" className="text-xs shrink-0">
            +200 XP
          </Badge>
        </CardContent>
      </Card>

      {/* Monuments grid 2x3 */}
      <section>
        <h2 className="text-white font-semibold text-base mb-3">
          Monumentos
          <span className="text-slate-500 font-normal text-sm ml-2">
            ({collected.length} coleccionados)
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {collected.map((m) => (
            <MonumentCard key={m.id} monument={m} isCollected={true} />
          ))}
          {locked.map((m) => (
            <MonumentCard key={m.id} monument={m} isCollected={false} />
          ))}
        </div>
      </section>

      {/* Trophies */}
      <section>
        <h2 className="text-white font-semibold text-base mb-3">
          Trofeos
          <span className="text-slate-500 font-normal text-sm ml-2">
            ({unlockedCount} ganados)
          </span>
        </h2>
        <div className="space-y-2.5">
          {ALL_TROPHIES.map((trophy) => (
            <TrophyCard
              key={trophy.id}
              trophy={trophy}
              isUnlocked={trophy.isUnlocked}
              progress={"progress" in trophy ? trophy.progress : undefined}
            />
          ))}
        </div>
      </section>

      {/* Leaderboard mini */}
      <section>
        <h2 className="text-white font-semibold text-base mb-3">Top Amigos</h2>
        <Card className="bg-slate-800/50 border-slate-700/30 divide-y divide-slate-700/30">
          {FRIENDS.map((friend, i) => (
            <div key={friend.name} className="flex items-center gap-3 p-3">
              <span className="text-lg w-6 text-center">{RANK_MEDALS[i]}</span>
              <span className="text-xl">{friend.emoji}</span>
              <span className="text-white text-sm flex-1">{friend.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-bold text-sm">{friend.monuments}</span>
                <span className="text-slate-500 text-xs">monumentos</span>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  )
}
