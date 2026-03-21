"use client"

import { Wind, Droplets, Thermometer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface WeatherWidgetProps {
  city?: string
  temperature?: number
  condition?: string
  humidity?: number
  wind?: number
  recommendation?: string
}

export default function WeatherWidget({
  city = "Madrid",
  temperature = 22,
  condition = "Soleado",
  humidity = 45,
  wind = 12,
  recommendation = "Perfecto para visitar el Retiro",
}: WeatherWidgetProps) {
  return (
    <Card className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-500/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">☀️</div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-white font-bold text-3xl">{temperature}°</p>
                <span className="text-amber-400/80 text-sm">C</span>
              </div>
              <p className="text-amber-400/80 text-xs font-medium">{city} · {condition}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="flex items-center gap-1 text-slate-300 text-xs">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>{humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300 text-xs">
              <Wind className="w-3 h-3 text-slate-400" />
              <span>{wind} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300 text-xs">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span>Índice UV 4</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-500/20">
          <p className="text-amber-300/90 text-xs">
            <span className="font-semibold">Recomendación del día:</span>{" "}
            {recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
