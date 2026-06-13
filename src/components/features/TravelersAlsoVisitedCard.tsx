"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"

interface TravelerSuggestion {
  id: string
  name: string
  category: string
  address: string | null
  imageUrl: string | null
  bookingUrl: string | null
  officialUrl: string | null
  pricePerPerson: number | null
  ticketPrice: number | null
  lat: number | null
  lng: number | null
}

interface TravelersAlsoVisitedCardProps {
  destination: string
  /** Names of activities already in the user's itinerary — excluded from suggestions */
  excludeNames: string[]
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  restaurant: "🍽️",
  gastronomia: "🍽️",
  museum: "🏛️",
  cultural: "🏛️",
  arte: "🎨",
  historia: "🏺",
  monument: "🏛️",
  nature: "🌳",
  naturaleza: "🌳",
  park: "🌳",
  viewpoint: "🌆",
  shopping: "🛍️",
  nightlife: "🌃",
  tour: "🚶",
  activity: "🎟️",
}

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "📍"
}

export function TravelersAlsoVisitedCard({ destination, excludeNames }: TravelersAlsoVisitedCardProps) {
  const [suggestions, setSuggestions] = useState<TravelerSuggestion[]>([])
  const [loaded, setLoaded] = useState(false)

  const excludeSet = useMemo(
    () => new Set(excludeNames.map(normalize).filter(Boolean)),
    [excludeNames]
  )

  useEffect(() => {
    if (!destination) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(`/api/suggestions/travelers?destination=${encodeURIComponent(destination)}`)
        if (!res.ok) {
          if (!cancelled) setLoaded(true)
          return
        }
        const payload = await res.json()
        const list = Array.isArray(payload?.data?.activities)
          ? (payload.data.activities as TravelerSuggestion[])
          : []
        if (!cancelled) {
          setSuggestions(list)
          setLoaded(true)
        }
      } catch {
        if (!cancelled) setLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [destination])

  const visible = useMemo(
    () => suggestions.filter((s) => !excludeSet.has(normalize(s.name))).slice(0, 6),
    [suggestions, excludeSet]
  )

  if (!loaded || visible.length === 0) return null

  return (
    <div className="px-5 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden p-4"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px]">🧭</span>
          <p className="text-[13px] font-semibold text-white">
            Otros viajeros también visitaron
          </p>
        </div>
        <p className="text-[11px] text-[#888] mb-3 leading-relaxed">
          Lugares que han incluido viajeros que planificaron {destination} en Viaje360.
        </p>

        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {visible.map((s) => {
            const link = s.bookingUrl ?? s.officialUrl
            const inner = (
              <>
                <div
                  className="w-full h-[88px] rounded-xl overflow-hidden mb-2 bg-[rgba(255,255,255,0.04)]"
                  style={{
                    backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] shrink-0">{categoryEmoji(s.category)}</span>
                  <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">
                    {s.name}
                  </p>
                </div>
                {s.pricePerPerson != null && s.pricePerPerson > 0 && (
                  <p className="text-[10px] text-[#888] mt-0.5">~{Math.round(s.pricePerPerson)} € / persona</p>
                )}
                {s.pricePerPerson == null && s.ticketPrice != null && s.ticketPrice > 0 && (
                  <p className="text-[10px] text-[#888] mt-0.5">Entrada ~{Math.round(s.ticketPrice)} €</p>
                )}
              </>
            )

            return link ? (
              <a
                key={s.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-[140px] snap-start rounded-xl p-2 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                {inner}
              </a>
            ) : (
              <div
                key={s.id}
                className="shrink-0 w-[140px] snap-start rounded-xl p-2"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                {inner}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
