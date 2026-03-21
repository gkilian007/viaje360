"use client"

import { useState } from "react"
import {
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Globe,
  Plane,
  Mountain,
  Share2,
  Moon,
  DollarSign,
  Calendar,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/useAppStore"
import { ShareCard } from "@/components/features/ShareCard"

const XP_TO_NEXT = 3000
const DAYS_TRAVELED = 24

const COLLECTED_MONUMENTS = [
  { name: "Museo del Prado", emoji: "🖼️" },
  { name: "Puerta del Sol", emoji: "☀️" },
  { name: "Palacio Real", emoji: "🏰" },
]

const UNLOCKED_TROPHIES = [
  { id: "t1", emoji: "🏆", name: "Explorador de Madrid" },
  { id: "t2", emoji: "🥇", name: "Amante del Arte" },
]

export default function ProfilePage() {
  const user = useAppStore((s) => s.user)
  const [showShare, setShowShare] = useState(false)
  const [notifOn, setNotifOn] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  const xpPercent = Math.min(Math.round((user.xp / XP_TO_NEXT) * 100), 100)
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col gap-5 p-4 pb-6">
      {/* Profile card */}
      <Card className="bg-gradient-to-br from-blue-900/60 to-purple-900/60 border-blue-500/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-xl font-bold">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="level" className="text-xs">
                  Nivel {user.level}
                </Badge>
                <span className="text-slate-400 text-xs">Explorador</span>
              </div>
            </div>
          </div>

          {/* XP progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{user.xp.toLocaleString()} XP</span>
              <span className="text-slate-500">
                Nivel {user.level + 1} → {XP_TO_NEXT.toLocaleString()} XP
              </span>
            </div>
            <Progress value={xpPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stats 2x2 */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Estadísticas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center p-4 bg-blue-900/30 border-blue-500/20">
            <Plane className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-bold text-2xl">{user.totalTrips}</p>
            <p className="text-slate-400 text-xs mt-1">Viajes</p>
          </Card>
          <Card className="text-center p-4 bg-purple-900/30 border-purple-500/20">
            <Mountain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-bold text-2xl">{user.monumentsCollected}</p>
            <p className="text-slate-400 text-xs mt-1">Monumentos</p>
          </Card>
          <Card className="text-center p-4 bg-emerald-900/30 border-emerald-500/20">
            <Globe className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-white font-bold text-2xl">{user.countriesVisited}</p>
            <p className="text-slate-400 text-xs mt-1">Países</p>
          </Card>
          <Card className="text-center p-4 bg-amber-900/30 border-amber-500/20">
            <Calendar className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-white font-bold text-2xl">{DAYS_TRAVELED}</p>
            <p className="text-slate-400 text-xs mt-1">Días viajados</p>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Logros</h2>
        <div className="flex gap-3">
          {UNLOCKED_TROPHIES.map((t) => (
            <div
              key={t.id}
              className="flex-1 bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 flex flex-col items-center gap-1.5"
            >
              <span className="text-3xl">{t.emoji}</span>
              <p className="text-white text-xs font-medium text-center leading-tight">{t.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social sharing */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Compartir</h2>
        <Card className="bg-slate-800/50 border-slate-700/30">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm mb-3">
              Comparte tu colección con amigos y muéstrales tus logros.
            </p>
            <Button
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="w-4 h-4" />
              Compartir mi colección
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Configuración</h2>
        <Card className="divide-y divide-slate-700/50">
          {/* Notificaciones toggle */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Notificaciones</p>
              <p className="text-slate-500 text-xs">Alertas y recordatorios</p>
            </div>
            <button
              onClick={() => setNotifOn((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                notifOn ? "bg-blue-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifOn ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Privacidad */}
          <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-left">
            <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Privacidad</p>
              <p className="text-slate-500 text-xs">Controla tus datos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </button>

          {/* Idioma */}
          <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-left">
            <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Idioma</p>
              <p className="text-slate-500 text-xs">Español</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </button>

          {/* Moneda */}
          <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-left">
            <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Moneda</p>
              <p className="text-slate-500 text-xs">EUR €</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </button>

          {/* Modo oscuro toggle */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Modo oscuro</p>
              <p className="text-slate-500 text-xs">Tema de la aplicación</p>
            </div>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                darkMode ? "bg-blue-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>
      </div>

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 gap-2"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </Button>

      <p className="text-center text-slate-600 text-xs">Viaje360 v1.0.0</p>

      {/* Share modal */}
      {showShare && (
        <ShareCard
          stats={{
            name: user.name,
            level: user.level,
            trips: user.totalTrips,
            monuments: user.monumentsCollected,
            countries: user.countriesVisited,
          }}
          topMonuments={COLLECTED_MONUMENTS}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
