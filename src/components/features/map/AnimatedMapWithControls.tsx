"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { DayItinerary, TimelineActivity } from "@/lib/types"
import { ACTIVITY_ICONS } from "@/lib/constants"
import {
  type ActivityWithCoords,
  type AvatarPosition,
  type AnimationState,
  getActivityCoordinates,
  getActivityColor,
} from "./types"
import { useRouteAnimation } from "./useRouteAnimation"
import { createAvatarMarkerElement, updateAvatarMarker } from "./TravelerAvatar"

interface AnimatedMapWithControlsProps {
  itinerary: DayItinerary[]
  selectedDay: number
  onActivityClick?: (activity: TimelineActivity, index: number) => void
  accessToken: string
  showList: boolean
  onToggleList: () => void
}

export function AnimatedMapWithControls({
  itinerary,
  selectedDay,
  onActivityClick,
  accessToken,
  showList,
  onToggleList,
}: AnimatedMapWithControlsProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const avatarMarkerRef = useRef<any>(null)
  const avatarElementRef = useRef<HTMLDivElement | null>(null)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapboxgl, setMapboxgl] = useState<any>(null)
  const [selectedActivity, setSelectedActivity] = useState<TimelineActivity | null>(null)

  const dayData = itinerary[selectedDay - 1]
  const rawActivities = dayData?.activities ?? []
  
  // Enrich activities with coordinates
  const activities: ActivityWithCoords[] = rawActivities.map((activity) => ({
    ...activity,
    coordinates: getActivityCoordinates(activity),
  }))

  // Handle position updates
  const handlePositionChange = useCallback((position: AvatarPosition) => {
    if (!avatarMarkerRef.current || !avatarElementRef.current || !map.current) return
    
    avatarMarkerRef.current.setLngLat([position.coordinate.lng, position.coordinate.lat])
    updateAvatarMarker(avatarElementRef.current, !position.isAtStop, position.bearing)
    
    if (!position.isAtStop && map.current) {
      map.current.easeTo({
        center: [position.coordinate.lng, position.coordinate.lat],
        duration: 300,
      })
    }
  }, [])

  // Handle activity reached
  const handleActivityReached = useCallback((index: number) => {
    markersRef.current.forEach((marker, i) => {
      const el = marker.getElement()
      if (el) {
        el.style.transform = i === index ? "scale(1.2)" : "scale(1)"
        el.style.zIndex = i === index ? "10" : "1"
      }
    })
  }, [])

  // Animation hook
  const animation = useRouteAnimation({
    activities,
    config: { speed: 0.00012, pauseAtStops: 1200 },
    onPositionChange: handlePositionChange,
    onActivityReached: handleActivityReached,
  })

  // Load Mapbox
  useEffect(() => {
    let mounted = true
    import("mapbox-gl").then((mod) => {
      if (mounted) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css"
        document.head.appendChild(link)
        setMapboxgl(mod.default)
      }
    })
    return () => { mounted = false }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxgl || map.current) return

    mapboxgl.accessToken = accessToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: activities.length > 0 
        ? [activities[0].coordinates.lng, activities[0].coordinates.lat]
        : [2.1734, 41.3851],
      zoom: 14,
      pitch: 50,
      bearing: -17.6,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.current.on("load", () => setIsLoaded(true))

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [accessToken, mapboxgl])

  // Update map elements
  useEffect(() => {
    if (!map.current || !isLoaded || !mapboxgl) return

    // Clear markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    if (avatarMarkerRef.current) {
      avatarMarkerRef.current.remove()
      avatarMarkerRef.current = null
    }

    // Clear layers
    ["route", "route-glow"].forEach((id) => {
      if (map.current.getLayer(id)) map.current.removeLayer(id)
    })
    if (map.current.getSource("route")) map.current.removeSource("route")

    if (activities.length === 0) return

    const coordinates = activities.map((a) => [a.coordinates.lng, a.coordinates.lat])

    // Route
    if (coordinates.length >= 2) {
      map.current.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } },
      })

      map.current.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        paint: { "line-color": "#0A84FF", "line-width": 12, "line-opacity": 0.2, "line-blur": 4 },
      })

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: { "line-color": "#0A84FF", "line-width": 4 },
      })
    }

    // Markers
    activities.forEach((activity, i) => {
      const el = createMarker(activity, i)
      const popup = new mapboxgl.Popup({ offset: 30, closeButton: false }).setHTML(createPopup(activity))
      const marker = new mapboxgl.Marker(el)
        .setLngLat([activity.coordinates.lng, activity.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!)
      el.onclick = () => {
        setSelectedActivity(activity)
        onActivityClick?.(activity, i)
      }
      markersRef.current.push(marker)
    })

    // Avatar
    avatarElementRef.current = createAvatarMarkerElement(false)
    avatarMarkerRef.current = new mapboxgl.Marker({ element: avatarElementRef.current, anchor: "center" })
      .setLngLat([activities[0].coordinates.lng, activities[0].coordinates.lat])
      .addTo(map.current!)

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds()
    coordinates.forEach((c) => bounds.extend(c as [number, number]))
    map.current.fitBounds(bounds, { padding: { top: 120, bottom: 200, left: 60, right: 60 }, maxZoom: 15, duration: 1000 })
  }, [activities, isLoaded, mapboxgl, onActivityClick])

  const canAnimate = activities.length >= 2

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1117]">
          <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-20 left-4 right-4 z-20">
        {!canAnimate ? (
          <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(19,19,21,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="material-symbols-outlined text-[24px] text-[#FF9F0A]">info</span>
            <p className="text-[13px] text-[#c0c6d6] mt-1">Añade al menos 2 actividades para animar</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(19,19,21,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={animation.reset}
              disabled={animation.state === "idle"}
              className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <span className="material-symbols-outlined text-[20px] text-white">replay</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={animation.state === "playing" ? animation.pause : animation.play}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: animation.state === "finished" 
                  ? "linear-gradient(135deg, #30D158, #00C853)"
                  : "linear-gradient(135deg, #0A84FF, #5856D6)",
                boxShadow: "0 4px 20px rgba(10,132,255,0.4)",
              }}
            >
              <span className="material-symbols-outlined text-[28px] text-white">
                {animation.state === "playing" ? "pause" : animation.state === "finished" ? "replay" : "play_arrow"}
              </span>
            </motion.button>

            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden min-w-[80px]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #0A84FF, #5856D6)" }}
                animate={{ width: `${animation.progress * 100}%` }}
              />
            </div>

            <span className="text-[12px] text-[#c0c6d6] font-medium min-w-[40px] text-right">
              {Math.round(animation.progress * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Stats badge */}
      <div className="absolute bottom-36 right-4 p-3 rounded-xl z-10" style={{ background: "rgba(19,19,21,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#0A84FF]">hiking</span>
          <span className="text-[13px] font-semibold text-white">{activities.length}</span>
          <span className="text-[11px] text-[#c0c6d6]">paradas</span>
        </div>
      </div>

      {/* Activity list */}
      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-40 left-4 right-4 max-h-[35vh] rounded-2xl overflow-hidden z-10"
            style={{ background: "rgba(19,19,21,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <p className="text-[14px] font-semibold text-white">Día {selectedDay} · {activities.length} paradas</p>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(40vh-50px)]">
              {activities.map((activity, i) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    animation.jumpToActivity(i)
                    setSelectedActivity(activity)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: animation.currentActivityIndex === i ? `${getActivityColor(activity.type)}15` : "rgba(42,42,44,0.5)",
                    border: `1px solid ${animation.currentActivityIndex === i ? `${getActivityColor(activity.type)}40` : "transparent"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[13px]"
                    style={{ background: animation.currentActivityIndex === i ? getActivityColor(activity.type) : i < animation.currentActivityIndex ? "#30D158" : "rgba(255,255,255,0.1)" }}
                  >
                    {i < animation.currentActivityIndex && animation.currentActivityIndex !== i ? "✓" : i + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-medium text-white truncate">{activity.name}</p>
                    <p className="text-[11px] text-[#c0c6d6]">{activity.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function createMarker(activity: TimelineActivity, index: number): HTMLDivElement {
  const color = getActivityColor(activity.type)
  const icon = activity.icon ?? ACTIVITY_ICONS[activity.type] ?? "place"
  
  const el = document.createElement("div")
  el.style.cssText = `width:44px;height:44px;cursor:pointer;transition:transform 0.2s;z-index:1;`
  
  const circle = document.createElement("div")
  circle.style.cssText = `width:100%;height:100%;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;position:relative;`
  
  const iconEl = document.createElement("span")
  iconEl.className = "material-symbols-outlined"
  iconEl.textContent = icon
  iconEl.style.cssText = `font-size:20px;color:white;font-variation-settings:'FILL' 1;`
  
  const badge = document.createElement("div")
  badge.style.cssText = `position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:white;color:#131315;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;`
  badge.textContent = String(index + 1)
  
  circle.appendChild(iconEl)
  circle.appendChild(badge)
  el.appendChild(circle)
  
  el.onmouseenter = () => { el.style.transform = "scale(1.15)"; el.style.zIndex = "10" }
  el.onmouseleave = () => { el.style.transform = "scale(1)"; el.style.zIndex = "1" }
  
  return el
}

function createPopup(activity: TimelineActivity): string {
  const color = getActivityColor(activity.type)
  return `<div style="font-family:Inter,system-ui;padding:12px;min-width:180px;">
    <div style="font-weight:600;font-size:14px;color:#131315;margin-bottom:4px;">${activity.name}</div>
    <div style="font-size:11px;color:#666;">${activity.time} · ${activity.duration}min · ${activity.location}</div>
    ${activity.cost > 0 ? `<div style="margin-top:6px;color:#22C55E;font-weight:500;">€${activity.cost}</div>` : ""}
  </div>`
}
