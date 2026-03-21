"use client"

import { MapPin, Plane, Hotel, Moon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/store/useAppStore"
import { demoItinerary } from "@/lib/demo-data"
import { ItineraryDay } from "@/components/features/ItineraryDay"
import { BudgetChart } from "@/components/features/BudgetChart"
import { TransportInfo } from "@/components/features/TransportInfo"

export default function TripPage() {
  const currentTrip = useAppStore((s) => s.currentTrip)

  if (!currentTrip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">No hay viaje activo</p>
      </div>
    )
  }

  const nights = Math.round(
    (new Date(currentTrip.endDate).getTime() - new Date(currentTrip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      {/* Trip Header */}
      <Card className="bg-gradient-to-br from-blue-900/70 to-slate-800/70 border-blue-500/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-400/10 rounded-full -translate-y-8 translate-x-8" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="success" className="text-[10px]">En Progreso</Badge>
            <Badge className="text-[10px] bg-slate-700/80 text-slate-300 border-slate-600 flex items-center gap-1">
              <Moon className="w-2.5 h-2.5" />
              {nights} noches
            </Badge>
          </div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-400 shrink-0" />
            {currentTrip.destination}, {currentTrip.country} 🇪🇸
          </h1>
          <p className="text-slate-400 text-sm mt-1">26 – 31 Mar 2026</p>
        </CardContent>
      </Card>

      {/* Reservations */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Reservas</h2>
        <div className="space-y-2">
          {/* Flight */}
          <Card className="border-blue-500/20 bg-blue-900/20">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">Iberia IB-1234</p>
                <p className="text-slate-400 text-xs">MAD-BCN → BCN-MAD · 26 Mar 2026</p>
              </div>
              <Badge variant="success" className="text-[10px] shrink-0">Confirmado ✅</Badge>
            </CardContent>
          </Card>

          {/* Hotel */}
          <Card className="border-purple-500/20 bg-purple-900/20">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Hotel className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">Hotel Plaza Mayor ★★★★</p>
                <p className="text-slate-400 text-xs">Check-in 26 Mar · {nights} noches</p>
              </div>
              <Badge variant="success" className="text-[10px] shrink-0">Confirmado ✅</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Itinerary */}
      <div>
        <h2 className="text-white font-semibold text-base mb-3">Itinerario</h2>
        <div className="space-y-2">
          {demoItinerary.map((day) => (
            <ItineraryDay key={day.date} day={day} />
          ))}
        </div>
      </div>

      {/* Transport */}
      <TransportInfo />

      {/* Budget Chart */}
      <BudgetChart />
    </div>
  )
}
