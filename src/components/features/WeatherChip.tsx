"use client"

import type { Weather } from "@/lib/types"

interface WeatherChipProps {
  weather: Weather
}

export function WeatherChip({ weather }: WeatherChipProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        background: "rgba(10, 132, 255, 0.12)",
        border: "1px solid rgba(10, 132, 255, 0.2)",
      }}
    >
      <span className="material-symbols-outlined text-[18px] text-[#0A84FF]"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
        {weather.icon}
      </span>
      <span className="text-[13px] font-semibold text-[#e4e2e4]">{weather.temp}°C</span>
      <span className="text-[12px] text-[#c0c6d6]">{weather.condition}</span>
    </div>
  )
}
