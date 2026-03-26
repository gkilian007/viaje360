"use client"

import { useState } from "react"
import type { DayWeather } from "@/lib/services/weather.service"
import { getWeatherDisplay } from "@/lib/services/weather.service"

interface WeatherAlertProps {
  weather: DayWeather
  dayNumber: number
  tripId: string
  onAdapted?: (days: unknown[]) => void
}

export function WeatherAlert({ weather, dayNumber, tripId, onAdapted }: WeatherAlertProps) {
  const [adapting, setAdapting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (weather.precipitationProbability < 60) return null

  const { icon } = getWeatherDisplay(weather.weatherCode)
  const isStorm = weather.weatherCode >= 95

  async function handleAdapt() {
    setAdapting(true)
    try {
      const res = await fetch("/api/itinerary/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          reason: `Lluvia prevista para el día ${dayNumber} (${weather.precipitationProbability}% probabilidad). Prioriza actividades de interior, museos y restaurantes. Mueve las actividades al aire libre a otro día si es posible.`,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data?.days && onAdapted) {
          onAdapted(data.data.days)
        }
      }
    } catch {
      // silent fail
    } finally {
      setAdapting(false)
    }
  }

  return (
    <div
      className="mx-5 mb-4 p-3.5 rounded-2xl"
      style={{
        background: isStorm ? "rgba(255,69,58,0.08)" : "rgba(10,132,255,0.08)",
        border: isStorm ? "1px solid rgba(255,69,58,0.15)" : "1px solid rgba(10,132,255,0.15)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-[22px] shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white mb-0.5">
            {isStorm ? "⚠️ Tormenta prevista" : "Lluvia probable hoy"}
          </p>
          <p className="text-[11px] text-[#888] mb-2.5">
            {weather.precipitationProbability}% probabilidad de lluvia · {weather.tempMin}°—{weather.tempMax}°
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAdapt}
              disabled={adapting}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-all"
              style={{
                background: "rgba(10,132,255,0.9)",
              }}
            >
              {adapting ? "Adaptando..." : "Adaptar plan"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-[#888] transition-all hover:text-white"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
