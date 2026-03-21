"use client"

import { useState } from "react"
import { Clock, MessageSquarePlus, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Activity } from "@/lib/types"

const categoryConfig: Record<
  string,
  { timeColor: string; border: string; bg: string; icon: string; label: string }
> = {
  museum:    { timeColor: "text-purple-400 border-purple-500/40", border: "border-purple-500/30", bg: "bg-purple-900/20", icon: "🎨", label: "Arte" },
  restaurant:{ timeColor: "text-orange-400 border-orange-500/40", border: "border-orange-500/30", bg: "bg-orange-900/20", icon: "🍽️", label: "Gastronomía" },
  park:      { timeColor: "text-green-400 border-green-500/40",  border: "border-green-500/30",  bg: "bg-green-900/20",  icon: "🌿", label: "Naturaleza" },
  monument:  { timeColor: "text-blue-400 border-blue-500/40",    border: "border-blue-500/30",   bg: "bg-blue-900/20",   icon: "🏛️", label: "Historia" },
  shopping:  { timeColor: "text-amber-400 border-amber-500/40",  border: "border-amber-500/30",  bg: "bg-amber-900/20",  icon: "🛍️", label: "Compras" },
  tour:      { timeColor: "text-slate-300 border-slate-600",     border: "border-slate-600/40",  bg: "bg-slate-800/40",  icon: "🗺️", label: "Tour" },
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

interface TimelineActivityProps {
  activity: Activity
  isLast?: boolean
}

export function TimelineActivity({ activity, isLast }: TimelineActivityProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const cfg = categoryConfig[activity.type] ?? categoryConfig.tour

  return (
    <div className="flex gap-3">
      {/* Left: time + vertical connector */}
      <div className="flex flex-col items-center w-14 shrink-0">
        <div
          className={`w-14 h-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${cfg.timeColor} bg-slate-900`}
        >
          {activity.time}
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-700 mt-1 min-h-[16px]" />}
      </div>

      {/* Right: activity card */}
      <div className={`flex-1 rounded-xl border p-3 mb-2 ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-base mt-0.5">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium leading-tight">{activity.name}</p>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(activity.duration)}
                </span>
                {activity.cost > 0 && (
                  <span className="text-emerald-400 font-medium">€{activity.cost}</span>
                )}
                <span className={`text-[10px] font-medium ${cfg.timeColor.split(" ")[0]}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>
          {activity.booked ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-6 text-[11px] text-slate-400 hover:text-white px-2 gap-1 -ml-1"
          onClick={() => setNoteOpen(!noteOpen)}
        >
          <MessageSquarePlus className="w-3 h-3" />
          Añadir nota
        </Button>
        {noteOpen && (
          <textarea
            className="w-full mt-1 bg-slate-900/60 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50"
            rows={2}
            placeholder="Escribe una nota sobre esta actividad..."
          />
        )}
      </div>
    </div>
  )
}
