"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface PublicActivity {
  id: string
  name: string
  type: string
  location: string
  time: string
  endTime?: string
  duration: number
  description?: string
  notes?: string
  lat?: number
  lng?: number
}

interface PublicDay {
  dayNumber: number
  date: string
  activities: PublicActivity[]
}

interface PublicTrip {
  id: string
  destination: string
  country: string
  startDate: string
  endDate: string
  days: PublicDay[]
}

const ACTIVITY_EMOJI: Record<string, string> = {
  museum: "🏛️",
  restaurant: "🍽️",
  monument: "🗿",
  park: "🌳",
  shopping: "🛍️",
  tour: "🗺️",
  hotel: "🏨",
  transport: "🚌",
  default: "📍",
}

function getEmoji(type: string): string {
  return ACTIVITY_EMOJI[type] ?? ACTIVITY_EMOJI.default
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
  return `${s.toLocaleDateString("es-ES", opts)} – ${e.toLocaleDateString("es-ES", opts)}, ${e.getFullYear()}`
}

function formatDayDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
}

export default function ShareTripPage() {
  const params = useParams()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<PublicTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!tripId) return

    fetch(`/api/trips/${tripId}/public`)
      .then((res) => {
        if (!res.ok) throw new Error("Trip not found")
        return res.json()
      })
      .then((data: PublicTrip) => setTrip(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tripId])

  const totalActivities = trip?.days.reduce((acc, d) => acc + d.activities.length, 0) ?? 0
  const totalDays = trip?.days.length ?? 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#c0c6d6] text-sm">Cargando itinerario…</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🗺️</p>
          <h1 className="text-white text-xl font-semibold mb-2">Itinerario no encontrado</h1>
          <p className="text-[#c0c6d6] text-sm mb-6">Este plan de viaje no existe o ha sido eliminado.</p>
          <Link
            href="/home"
            className="inline-block bg-[#0A84FF] text-white px-6 py-3 rounded-xl text-sm font-semibold"
          >
            Planifica tu viaje →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ── Header / branding ── */}
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <span className="text-white font-bold text-sm">Viaje360</span>
          <span className="text-[#c0c6d6] text-xs">· Plan compartido</span>
        </div>
        <Link
          href="/home"
          className="text-[#0A84FF] text-sm font-semibold hover:underline"
        >
          Planifica tu viaje →
        </Link>
      </header>

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-4 pt-10 pb-8"
        style={{ background: "linear-gradient(180deg,rgba(10,132,255,0.15) 0%,transparent 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-[#0A84FF] text-sm font-semibold mb-2 uppercase tracking-wider">Itinerario</p>
          <h1 className="text-white text-3xl font-bold mb-1">
            {trip.destination}
            {trip.country ? `, ${trip.country}` : ""}
          </h1>
          <p className="text-[#c0c6d6] text-sm mb-6">
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>

          {/* Stats pills */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="text-white text-sm font-semibold">{totalDays} días</span>
            </div>
            <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-white text-sm font-semibold">{totalActivities} actividades</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Itinerary days ── */}
      <main className="max-w-2xl mx-auto px-4 pb-24">
        {trip.days.map((day) => (
          <section key={day.dayNumber} className="mb-8">
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#0A84FF,#5E5CE6)" }}
              >
                {day.dayNumber}
              </div>
              <div>
                <p className="text-white font-semibold text-sm capitalize">
                  {formatDayDate(day.date)}
                </p>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-3 pl-4 border-l border-white/[0.06]">
              {day.activities.length === 0 && (
                <p className="text-[#666] text-sm italic">Sin actividades planificadas</p>
              )}
              {day.activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-[#1a1a2e]/80 border border-white/[0.06] rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{getEmoji(act.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-snug">{act.name}</p>
                      {act.location && (
                        <p className="text-[#c0c6d6] text-xs mt-0.5 truncate">📍 {act.location}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[#0A84FF] text-xs font-medium">{act.time}</span>
                        {act.duration > 0 && (
                          <span className="text-[#666] text-xs">·</span>
                        )}
                        {act.duration > 0 && (
                          <span className="text-[#c0c6d6] text-xs">
                            {act.duration >= 60
                              ? `${Math.floor(act.duration / 60)}h${act.duration % 60 > 0 ? ` ${act.duration % 60}min` : ""}`
                              : `${act.duration} min`}
                          </span>
                        )}
                      </div>
                      {act.description && (
                        <p className="text-[#c0c6d6] text-xs mt-2 leading-relaxed line-clamp-3">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* ── Sticky CTA footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/[0.06] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <p className="text-[#c0c6d6] text-sm">
            Creado con <span className="text-white font-semibold">Viaje360</span>
          </p>
          <Link
            href="/home"
            className="shrink-0 bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            Planifica tu viaje →
          </Link>
        </div>
      </div>

      {/* ── Copy link toast (hidden — triggered via plan/page.tsx button) ── */}
      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#30D158] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
          ✅ Enlace copiado
        </div>
      )}
    </div>
  )
}
