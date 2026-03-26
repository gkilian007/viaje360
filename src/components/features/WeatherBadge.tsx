"use client"

import type { DayWeather } from "@/lib/services/weather.service"
import { getWeatherDisplay } from "@/lib/services/weather.service"

interface WeatherBadgeProps {
  weather: DayWeather
  compact?: boolean
}

export function WeatherBadge({ weather, compact = false }: WeatherBadgeProps) {
  const { icon, label } = getWeatherDisplay(weather.weatherCode)
  const isRainy = weather.precipitationProbability >= 50

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{
          background: isRainy ? "rgba(10,132,255,0.1)" : "rgba(255,214,10,0.1)",
          color: isRainy ? "#6BB8FF" : "#FFD60A",
          border: isRainy ? "1px solid rgba(10,132,255,0.2)" : "1px solid rgba(255,214,10,0.2)",
        }}
      >
        {icon} {weather.tempMax}°
      </span>
    )
  }

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
      style={{
        background: isRainy ? "rgba(10,132,255,0.06)" : "rgba(255,214,10,0.06)",
        border: isRainy ? "1px solid rgba(10,132,255,0.12)" : "1px solid rgba(255,214,10,0.12)",
      }}
    >
      <span className="text-[22px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-white">{label}</p>
        <p className="text-[11px] text-[#888]">
          {weather.tempMin}° — {weather.tempMax}°
          {weather.precipitationProbability > 0 && (
            <span className={isRainy ? " text-[#6BB8FF]" : ""}>
              {" "}· 💧 {weather.precipitationProbability}%
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
