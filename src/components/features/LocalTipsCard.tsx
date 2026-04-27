"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLocalTips, getAllLocalTips, type LocalTip } from "@/lib/services/local-tips.service"

interface LocalTipsCardProps {
  destination: string
  /** Show all tips or just contextual ones */
  mode?: "contextual" | "all"
  lat?: number
  lng?: number
}

interface NearbyPOI {
  name: string
  type: string
  lat: number
  lng: number
  distanceMeters: number
  mapsUrl: string
  emoji: string
  durationMinutes: number
  openNow: boolean
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 18) return "afternoon"
  return "evening"
}

export function LocalTipsCard({ destination, mode = "contextual", lat, lng }: LocalTipsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTip, setActiveTip] = useState(0)
  const [fallbackState, setFallbackState] = useState<{ key: string; tips: LocalTip[] }>({ key: "", tips: [] })

  const curatedTips = useMemo(() => {
    if (mode === "all") return getAllLocalTips(destination)
    return getLocalTips(destination, { timeOfDay: getTimeOfDay() })
  }, [destination, mode])

  const nearbyKey = `${destination}:${lat ?? "none"}:${lng ?? "none"}:${mode}`

  useEffect(() => {
    if (curatedTips.length > 0 || lat == null || lng == null) return

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=900`)
        if (!res.ok) return

        const payload = await res.json()
        const pois = Array.isArray(payload?.data?.pois) ? (payload.data.pois as NearbyPOI[]) : []
        if (cancelled) return

        const dynamicTips = pois.slice(0, 4).map((poi, idx) => ({
          id: `nearby-${poi.name}-${idx}`,
          emoji: poi.emoji || "📍",
          title: `${poi.name} a ${Math.max(1, Math.round(poi.distanceMeters / 100)) * 100} m`,
          body: buildNearbyTipBody(poi),
          category: mapPoiTypeToCategory(poi.type),
          timing: "anytime" as const,
        }))

        setFallbackState({ key: nearbyKey, tips: dynamicTips })
      } catch {
        if (!cancelled) setFallbackState({ key: nearbyKey, tips: [] })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [curatedTips.length, lat, lng, nearbyKey])

  const fallbackTips = fallbackState.key === nearbyKey ? fallbackState.tips : []
  const tips = curatedTips.length > 0 ? curatedTips : fallbackTips

  // Auto-rotate tips every 8 seconds
  useEffect(() => {
    if (tips.length <= 1 || expanded) return
    const timer = setInterval(() => {
      setActiveTip(prev => (prev + 1) % tips.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [tips.length, expanded])

  if (tips.length === 0) return null

  const currentTip = tips[activeTip % tips.length]

  return (
    <div className="px-5 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Collapsed: rotating single tip */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-[20px] shrink-0">{currentTip.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[12px] font-semibold text-white">{currentTip.title}</p>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,214,10,0.1)", color: "#FFD60A" }}
                  >
                    TIP LOCAL
                  </span>
                </div>
                <p className="text-[11px] text-[#aaa] leading-relaxed">{currentTip.body}</p>
              </div>
            </div>

            {/* Dot indicators */}
            {tips.length > 1 && (
              <div className="flex justify-center gap-1 mt-3">
                {tips.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: idx === activeTip ? "#FFD60A" : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            )}
          </button>
        )}

        {/* Expanded: all tips */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-white">
                  💡 Tips locales — {destination}
                </p>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-[10px] text-[#666] px-2 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-2">
                {tips.map(tip => (
                  <TipRow key={tip.id} tip={tip} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function mapPoiTypeToCategory(type: string): LocalTip["category"] {
  switch (type) {
    case "gastronomia":
      return "food"
    case "historia":
    case "arte":
    case "cultural":
      return "practical"
    case "naturaleza":
    case "fotografia":
      return "practical"
    default:
      return "practical"
  }
}

function buildNearbyTipBody(poi: NearbyPOI): string {
  const walkMinutes = Math.max(1, Math.round(poi.durationMinutes / 2))

  if (poi.type === "gastronomia") {
    return `Tienes una parada gastronómica cerca. ${poi.name} está a unos ${walkMinutes} min andando y puede encajar perfecto como pausa espontánea.`
  }

  if (poi.type === "historia" || poi.type === "arte" || poi.type === "cultural") {
    return `Hay un punto cultural muy cerca de tu ruta. ${poi.name} está a mano y puede darte un mini desvío con bastante valor sin romper el día.`
  }

  if (poi.type === "naturaleza" || poi.type === "fotografia") {
    return `Si te apetece aire o una foto buena, ${poi.name} está muy cerca y es una parada fácil de meter entre actividades.`
  }

  return `${poi.name} está cerca de donde te mueves ahora y puede ser una buena parada improvisada si tienes un hueco.`
}

function TipRow({ tip }: { tip: LocalTip }) {
  const catColor: Record<string, string> = {
    money: "#30D158",
    safety: "#FF453A",
    transport: "#0A84FF",
    food: "#FF9F0A",
    etiquette: "#BF5AF2",
    practical: "#64D2FF",
  }

  return (
    <div
      className="flex items-start gap-2.5 p-2.5 rounded-xl"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <span className="text-[16px] shrink-0">{tip.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[11px] font-semibold text-white">{tip.title}</p>
          <span
            className="text-[8px] px-1 py-0.5 rounded"
            style={{
              background: `${catColor[tip.category] ?? "#888"}15`,
              color: catColor[tip.category] ?? "#888",
            }}
          >
            {tip.category.toUpperCase()}
          </span>
        </div>
        <p className="text-[10px] text-[#999] leading-relaxed">{tip.body}</p>
      </div>
    </div>
  )
}
