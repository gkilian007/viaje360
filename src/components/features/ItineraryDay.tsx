"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Sun, Cloud } from "lucide-react"
import { TimelineActivity } from "./TimelineActivity"
import type { DayItinerary } from "@/lib/types"

const dayTitles: Record<number, string> = {
  1: "Llegada y Centro",
  2: "Arte y Cultura",
  3: "Historia",
}

const dayWeather: Record<number, React.ReactNode> = {
  1: <Sun className="w-4 h-4 text-yellow-400" />,
  2: <Sun className="w-4 h-4 text-yellow-400" />,
  3: <Cloud className="w-4 h-4 text-blue-300" />,
}

interface ItineraryDayProps {
  day: DayItinerary
}

export function ItineraryDay({ day }: ItineraryDayProps) {
  const [collapsed, setCollapsed] = useState(false)

  const title = dayTitles[day.dayNumber] ?? `Día ${day.dayNumber}`
  const weather = dayWeather[day.dayNumber]

  const dateLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/40 overflow-hidden">
      {/* Day header button */}
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/20 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{day.dayNumber}</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-white text-sm font-semibold">{title}</p>
          <p className="text-slate-500 text-[10px] capitalize">{dateLabel}</p>
        </div>
        {weather}
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Activities */}
      {!collapsed && (
        <div className="px-3 pt-1 pb-2">
          {day.activities.map((activity, idx) => (
            <TimelineActivity
              key={activity.id}
              activity={activity}
              isLast={idx === day.activities.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
