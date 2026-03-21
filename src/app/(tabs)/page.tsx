"use client"

import { MapPin, Calendar, Trophy, Mountain, Star, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/useAppStore"
import WeatherWidget from "@/components/features/WeatherWidget"
import BudgetWidget from "@/components/features/BudgetWidget"
import QuickStats from "@/components/features/QuickStats"

const rarityColors: Record<string, string> = {
  common: "bg-slate-700/40 border-slate-600/30 text-slate-300",
  rare: "bg-blue-900/40 border-blue-500/30 text-blue-300",
  epic: "bg-purple-900/40 border-purple-500/30 text-purple-300",
  legendary: "bg-amber-900/40 border-amber-500/30 text-amber-300",
}

const suggestedActivities = [
  {
    id: "sug-1",
    name: "Parque del Retiro",
    time: "10:00",
    duration: "2h",
    cost: 0,
    emoji: "🌳",
  },
  {
    id: "sug-2",
    name: "Museo Reina Sofía",
    time: "14:00",
    duration: "2.5h",
    cost: 12,
    emoji: "🎨",
  },
]

export default function HomePage() {
  const { user, currentTrip, monuments } = useAppStore()

  const collectedMonuments = monuments.filter((m) => m.collected)

  const today = new Date()
  const tripStart = currentTrip ? new Date(currentTrip.startDate) : null
  const daysUntil = tripStart
    ? Math.max(0, Math.ceil((tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      {/* Hero Card */}
      <Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-slate-800/60 shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-8 -translate-x-8" />
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-300/80 text-sm mb-0.5">¡Bienvenido de vuelta!</p>
              <h1 className="text-white text-2xl font-bold">{user.name.split(" ")[0]} ✈️</h1>
            </div>
            <div className="text-right">
              <Badge variant="level" className="text-xs mb-1">Nv. {user.level}</Badge>
              <p className="text-slate-400 text-xs">{user.xp} XP</p>
            </div>
          </div>

          {currentTrip && (
            <div className="mt-4 flex items-center gap-3 bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">
                    {currentTrip.destination}, {currentTrip.country}
                  </p>
                  <Badge variant="success" className="text-[10px] py-0">Activo</Badge>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {daysUntil !== null && daysUntil > 0 ? (
                    <p className="text-slate-400 text-xs">
                      <span className="text-purple-300 font-semibold">{daysUntil} días</span> para tu viaje
                    </p>
                  ) : (
                    <p className="text-emerald-400 text-xs font-semibold">¡En curso ahora!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather Widget */}
      <WeatherWidget
        city="Madrid"
        temperature={22}
        condition="Soleado"
        humidity={45}
        wind={12}
        recommendation="Perfecto para visitar el Retiro hoy"
      />

      {/* Budget Summary */}
      <BudgetWidget spent={currentTrip?.spent ?? 847} total={currentTrip?.budget ?? 1500} />

      {/* Quick Stats */}
      <QuickStats
        monumentsCollected={collectedMonuments.length}
        level={user.level}
        totalTrips={user.totalTrips}
      />

      {/* Actividad de hoy */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Actividad de hoy</h2>
        <div className="space-y-2">
          {suggestedActivities.map((activity) => (
            <Card key={activity.id} className="border-slate-700/40">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center flex-shrink-0 text-lg">
                  {activity.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{activity.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{activity.time}</span>
                    </div>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-xs">{activity.duration}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {activity.cost === 0 ? (
                    <Badge variant="success" className="text-[10px]">Gratis</Badge>
                  ) : (
                    <span className="text-slate-300 text-xs font-medium">€{activity.cost}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quiz CTA */}
      <Card className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">¿Cuánto sabes de Madrid?</p>
                <p className="text-slate-400 text-xs">Gana +50 XP por respuesta correcta</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-semibold px-4"
            >
              Empezar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent monuments */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Monumentos recientes</h2>
        <div className="grid grid-cols-3 gap-2">
          {collectedMonuments.slice(0, 3).map((monument) => (
            <Card
              key={monument.id}
              className={`p-2.5 border text-center ${rarityColors[monument.rarity] ?? rarityColors.common}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-1.5">
                <Mountain className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-medium leading-tight line-clamp-2">{monument.name}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[9px] text-amber-400">+{monument.xpReward}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
