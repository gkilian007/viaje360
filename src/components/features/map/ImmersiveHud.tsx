"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HudActivity {
  id: string
  name: string
  type: string
  time: string
  duration: number
  location: string
  lat: number
  lng: number
}

interface SegmentInfo {
  fromId: string
  toId: string
  distanceMeters?: number
  durationSeconds?: number
  mode: "foot" | "car" | "transit"
  /** For transit segments: first line to board */
  transitInfo?: {
    lineName: string
    lineShort: string
    vehicle: string
    color: string
    textColor: string
    departureStop: string
    arrivalStop: string
    stopCount: number
    headsign: string
  }
}

interface ImmersiveHudProps {
  /** Geocoded activities for the current day */
  activities: HudActivity[]
  /** Index of the "active" activity (0-based). Defaults to 0 */
  activeIndex?: number
  /** Route segment info (from useRouteGeometry) */
  segments: SegmentInfo[]
  /** Callback when user taps an activity in the progress bar */
  onActivitySelect?: (index: number) => void
  /** Callback when user taps the navigate button */
  onNavigate?: (fromIndex: number, toIndex: number) => void
  /** Whether to show the compact (minimap-only) view */
  compact?: boolean
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDistance(meters?: number): string {
  if (meters == null) return ""
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds?: number): string {
  if (seconds == null) return ""
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

function getBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const TYPE_EMOJI: Record<string, string> = {
  museum: "🏛️", restaurant: "🍴", monument: "🏰", park: "🌳",
  shopping: "🛍️", tour: "🚶", hotel: "🏨", transport: "🚇",
  nightlife: "🌙", beach: "🏖️", entertainment: "🎭", cafe: "☕",
}

const MODE_ICON: Record<string, string> = {
  foot: "directions_walk",
  transit: "directions_transit",
  car: "directions_car",
}

const MODE_COLOR: Record<string, string> = {
  foot: "#30D158",
  transit: "#0A84FF",
  car: "#FF9F0A",
}

/* ------------------------------------------------------------------ */
/*  1. Minimap (circular GTA-style)                                    */
/* ------------------------------------------------------------------ */

function CircularMinimap({
  activities,
  activeIndex,
  onActivitySelect,
}: {
  activities: HudActivity[]
  activeIndex: number
  onActivitySelect?: (index: number) => void
}) {
  const valid = activities.filter((a) => isFinite(a.lat) && isFinite(a.lng))
  if (valid.length < 2) return null

  const active = valid[activeIndex] ?? valid[0]
  const next = valid[activeIndex + 1]
  const bearing = next ? getBearing(active, next) : 0

  // Compute viewport for minimap dots
  const visibleCount = Math.min(valid.length, 7)
  const startIdx = Math.max(0, Math.min(activeIndex - 1, valid.length - visibleCount))
  const visible = valid.slice(startIdx, startIdx + visibleCount)

  const lats = visible.map((a) => a.lat)
  const lngs = visible.map((a) => a.lng)
  const spanLat = Math.max(0.001, Math.max(...lats) - Math.min(...lats))
  const spanLng = Math.max(0.001, Math.max(...lngs) - Math.min(...lngs))
  const minLat = Math.min(...lats)
  const minLng = Math.min(...lngs)

  const mapToCircle = (lat: number, lng: number) => {
    const padding = 14
    const diameter = 122
    const usable = diameter - padding * 2
    const x = padding + ((lng - minLng) / spanLng) * usable
    const y = (diameter - padding) - ((lat - minLat) / spanLat) * usable
    return { x, y }
  }

  return (
    <div
      className="relative h-[122px] w-[122px] overflow-hidden rounded-full border border-white/18 bg-[#05070d]/88 shadow-[0_20px_60px_rgba(0,0,0,0.62)] backdrop-blur-xl"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        // Find closest dot
        let closest = -1
        let closestDist = Infinity
        visible.forEach((a, i) => {
          const pos = mapToCircle(a.lat, a.lng)
          const dist = Math.hypot(pos.x - clickX, pos.y - clickY)
          if (dist < closestDist && dist < 20) {
            closestDist = dist
            closest = startIdx + i
          }
        })
        if (closest >= 0) onActivitySelect?.(closest)
      }}
    >
      {/* Inner ring */}
      <div className="absolute inset-[10px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,rgba(10,132,255,0.20),rgba(4,8,18,0.95)_60%)]" />

      {/* Compass marks */}
      <div className="absolute left-1/2 top-[12px] -translate-x-1/2 text-[9px] font-black tracking-[0.22em] text-white/55">N</div>
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/8" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/8" />

      {/* Center you-are-here pulse */}
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0A84FF]/55 bg-[#0A84FF]/18 shadow-[0_0_18px_rgba(10,132,255,0.65)]">
        <div className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-[58%] border-x-[6px] border-b-[16px] border-x-transparent border-b-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      </div>

      {/* Bearing line to next activity */}
      {next && (
        <div
          className="absolute left-1/2 top-1/2 h-[2px] w-[42px] origin-left bg-[#30D158] shadow-[0_0_12px_rgba(48,209,88,0.85)]"
          style={{ transform: `translate(-50%, -50%) rotate(${bearing - 90}deg)` }}
        />
      )}

      {/* Activity dots */}
      {visible.map((a, i) => {
        const globalIdx = startIdx + i
        const pos = mapToCircle(a.lat, a.lng)
        const isCurrent = globalIdx === activeIndex
        const isNext = globalIdx === activeIndex + 1

        return (
          <div
            key={a.id}
            className={`absolute flex items-center justify-center rounded-full text-[8px] font-black text-white transition-all duration-300 ${
              isNext
                ? "h-4 w-4 bg-[#30D158]"
                : isCurrent
                ? "h-4 w-4 bg-[#0A84FF]"
                : "h-3 w-3 bg-white/28"
            }`}
            style={{
              left: pos.x,
              top: pos.y,
              boxShadow: isNext
                ? "0 0 14px rgba(48,209,88,0.8)"
                : isCurrent
                ? "0 0 12px rgba(10,132,255,0.8)"
                : undefined,
              transform: "translate(-50%, -50%)",
            }}
          >
            {(isCurrent || isNext) ? globalIdx + 1 : ""}
          </div>
        )
      })}

      {/* Vignette overlay */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_28px_rgba(0,0,0,0.78)]" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  2. Progress Bar (between activities)                               */
/* ------------------------------------------------------------------ */

function ActivityProgressBar({
  activities,
  activeIndex,
  onActivitySelect,
}: {
  activities: HudActivity[]
  activeIndex: number
  onActivitySelect?: (index: number) => void
}) {
  if (activities.length === 0) return null

  const progress = activities.length > 1 ? activeIndex / (activities.length - 1) : 1

  return (
    <div className="px-1">
      {/* Dot track */}
      <div className="relative flex items-center justify-between gap-0">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/10" />
        {/* Filled line */}
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#30D158] transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Activity dots */}
        {activities.map((a, i) => {
          const isActive = i === activeIndex
          const isPast = i < activeIndex
          const isNext = i === activeIndex + 1

          return (
            <button
              key={a.id}
              onClick={() => onActivitySelect?.(i)}
              className="relative z-10 flex items-center justify-center transition-all duration-300"
            >
              <div
                className={`flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                  isActive
                    ? "h-7 w-7 bg-[#0A84FF] text-white shadow-[0_0_16px_rgba(10,132,255,0.6)]"
                    : isNext
                    ? "h-6 w-6 bg-[#30D158] text-white shadow-[0_0_12px_rgba(48,209,88,0.5)]"
                    : isPast
                    ? "h-5 w-5 bg-white/20 text-white/50"
                    : "h-5 w-5 bg-white/10 text-white/30"
                }`}
              >
                {isActive ? TYPE_EMOJI[a.type] ?? (i + 1) : i + 1}
              </div>
            </button>
          )
        })}
      </div>

      {/* Time labels */}
      <div className="mt-1.5 flex justify-between px-0.5">
        {activities.map((a, i) => (
          <span
            key={a.id}
            className={`text-[9px] font-medium transition-colors duration-300 ${
              i === activeIndex ? "text-white" : "text-white/30"
            }`}
          >
            {i === activeIndex || i === 0 || i === activities.length - 1 ? a.time : ""}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  3. Navigation Banner (next activity indicator)                     */
/* ------------------------------------------------------------------ */

function NavigationBanner({
  current,
  next,
  segment,
  onNavigate,
}: {
  current: HudActivity
  next: HudActivity
  segment?: SegmentInfo
  onNavigate?: () => void
}) {
  const mode = segment?.mode ?? "foot"
  const modeColor = MODE_COLOR[mode]
  const icon = MODE_ICON[mode]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-2xl border border-white/10 bg-[#131315]/92 p-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Top: mode + distance */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ color: modeColor }}
          >
            {icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: modeColor }}>
            {mode === "foot" ? "A pie" : mode === "transit" ? "Transporte" : "Coche"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {segment?.distanceMeters != null && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/70">
              {formatDistance(segment.distanceMeters)}
            </span>
          )}
          {segment?.durationSeconds != null && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${modeColor}18`, color: modeColor }}>
              {formatDuration(segment.durationSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Transit line: which line to board and from which stop */}
      {mode === "transit" && segment?.transitInfo && (
        <div className="mb-2 flex items-center gap-2">
          <span
            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: segment.transitInfo.color,
              color: segment.transitInfo.textColor,
            }}
          >
            {segment.transitInfo.lineShort || segment.transitInfo.lineName || "Línea"}
          </span>
          {segment.transitInfo.departureStop && (
            <span className="truncate text-[11px] text-white/60">
              desde {segment.transitInfo.departureStop}
            </span>
          )}
        </div>
      )}

      {/* Destination info */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#30D158]/30 bg-[#30D158]/12">
          <span className="text-[18px]">{TYPE_EMOJI[next.type] ?? "📍"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-white">
            {next.name}
          </div>
          <div className="truncate text-[11px] text-white/50">
            {next.location} · {next.time}
          </div>
        </div>

        {/* Navigate button */}
        <button
          type="button"
          onClick={onNavigate}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#0A84FF]/40 bg-[#0A84FF]/18 shadow-[0_0_16px_rgba(10,132,255,0.25)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px] text-[#0A84FF]">
            navigation
          </span>
        </button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  4. Activity Peek (current activity card)                           */
/* ------------------------------------------------------------------ */

function ActivityPeek({ activity, index }: { activity: HudActivity; index: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[14px]"
        style={{ background: "rgba(10,132,255,0.15)" }}
      >
        {TYPE_EMOJI[activity.type] ?? "📍"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-semibold text-white">
          {activity.name}
        </div>
        <div className="text-[10px] text-white/40">
          {activity.time} · {activity.duration} min
          {activity.location ? ` · ${activity.location}` : ""}
        </div>
      </div>
      <span className="text-[10px] font-bold text-[#0A84FF]">#{index + 1}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  5. Arrival Card (when at last activity)                            */
/* ------------------------------------------------------------------ */

function ArrivalCard({ activity, index }: { activity: HudActivity; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-[#30D158]/20 bg-[#30D158]/8 p-4 text-center backdrop-blur-xl"
    >
      <div className="mb-2 text-[28px]">🎉</div>
      <div className="text-[14px] font-bold text-white">¡Has llegado!</div>
      <div className="mt-1 text-[12px] text-white/60">
        {activity.name}
      </div>
      <div className="mt-0.5 text-[10px] text-white/40">
        Última actividad del día · {activity.time}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main HUD component                                                 */
/* ------------------------------------------------------------------ */

export function ImmersiveHud({
  activities,
  activeIndex = 0,
  segments,
  onActivitySelect,
  onNavigate,
  compact = false,
}: ImmersiveHudProps) {
  const [internalIndex, setInternalIndex] = useState(activeIndex)

  // Sync with external activeIndex
  useEffect(() => {
    setInternalIndex(activeIndex)
  }, [activeIndex])

  const validActivities = useMemo(
    () => activities.filter((a) => isFinite(a.lat) && isFinite(a.lng)),
    [activities]
  )

  const current = validActivities[internalIndex]
  const next = validActivities[internalIndex + 1]
  const isLast = !next

  // Find the segment between current and next
  const currentSegment = useMemo(() => {
    if (!current || !next) return undefined
    return segments.find(
      (s) => s.fromId === current.id && s.toId === next.id
    )
  }, [segments, current, next])

  const handleActivitySelect = useCallback(
    (index: number) => {
      setInternalIndex(index)
      onActivitySelect?.(index)
    },
    [onActivitySelect]
  )

  const handleNavigate = useCallback(() => {
    if (current && next) {
      onNavigate?.(internalIndex, internalIndex + 1)
    }
  }, [current, next, internalIndex, onNavigate])

  if (validActivities.length === 0 || !current) return null

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-[1100] md:hidden">
      <div className="px-3 pb-3">
        {/* Gradient background to separate HUD from map */}
        <div
          className="absolute inset-x-0 bottom-0 h-[280px] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(15,17,23,0.95), rgba(15,17,23,0.7) 60%, transparent)",
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Row 1: Minimap + Navigation Banner */}
          <div className="flex items-end gap-3">
            {/* Circular minimap */}
            <div className="shrink-0">
              <CircularMinimap
                activities={validActivities}
                activeIndex={internalIndex}
                onActivitySelect={handleActivitySelect}
              />
            </div>

            {/* Navigation banner or arrival card */}
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                {isLast ? (
                  <ArrivalCard
                    key="arrival"
                    activity={current}
                    index={internalIndex}
                  />
                ) : (
                  <NavigationBanner
                    key={`nav-${current.id}-${next?.id}`}
                    current={current}
                    next={next!}
                    segment={currentSegment}
                    onNavigate={handleNavigate}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Row 2: Activity progress bar */}
          {!compact && validActivities.length > 1 && (
            <div className="mt-3">
              <ActivityProgressBar
                activities={validActivities}
                activeIndex={internalIndex}
                onActivitySelect={handleActivitySelect}
              />
            </div>
          )}

          {/* Row 3: Current activity peek */}
          {!compact && (
            <div className="mt-2">
              <ActivityPeek activity={current} index={internalIndex} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export type { ImmersiveHudProps, HudActivity, SegmentInfo }
