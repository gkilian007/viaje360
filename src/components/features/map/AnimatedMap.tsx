"use client"

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react"
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

export interface AnimatedMapRef {
  play: () => void
  pause: () => void
  reset: () => void
  jumpToActivity: (index: number) => void
  state: AnimationState
  progress: number
  currentActivityIndex: number
}

interface AnimatedMapProps {
  itinerary: DayItinerary[]
  selectedDay: number
  onActivityClick?: (activity: TimelineActivity, index: number) => void
  onStateChange?: (state: AnimationState) => void
  onActivityReached?: (index: number) => void
  accessToken: string
}

export const AnimatedMapComponent = forwardRef<AnimatedMapRef, AnimatedMapProps>(
  function AnimatedMapComponent(
    {
      itinerary,
      selectedDay,
      onActivityClick,
      onStateChange,
      onActivityReached,
      accessToken,
    },
    ref
  ) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const avatarMarkerRef = useRef<any>(null)
    const avatarElementRef = useRef<HTMLDivElement | null>(null)
    
    const [isLoaded, setIsLoaded] = useState(false)
    const [mapboxgl, setMapboxgl] = useState<any>(null)

    const dayData = itinerary[selectedDay - 1]
    const rawActivities = dayData?.activities ?? []
    
    // Enrich activities with coordinates
    const activities: ActivityWithCoords[] = rawActivities.map((activity) => ({
      ...activity,
      coordinates: getActivityCoordinates(activity),
    }))

    // Handle position updates from animation
    const handlePositionChange = useCallback((position: AvatarPosition) => {
      if (!avatarMarkerRef.current || !avatarElementRef.current || !map.current) return
      
      // Update marker position
      avatarMarkerRef.current.setLngLat([position.coordinate.lng, position.coordinate.lat])
      
      // Update avatar appearance
      updateAvatarMarker(avatarElementRef.current, !position.isAtStop, position.bearing)
      
      // Follow with camera if moving
      if (!position.isAtStop && map.current) {
        map.current.easeTo({
          center: [position.coordinate.lng, position.coordinate.lat],
          duration: 300,
          easing: (t: number) => t,
        })
      }
    }, [])

    // Handle activity reached
    const handleActivityReached = useCallback((index: number) => {
      onActivityReached?.(index)
      
      // Highlight marker
      markersRef.current.forEach((marker, i) => {
        const el = marker.getElement()
        if (el) {
          if (i === index) {
            el.style.transform = "scale(1.2)"
            el.style.zIndex = "10"
          } else {
            el.style.transform = "scale(1)"
            el.style.zIndex = "1"
          }
        }
      })
    }, [onActivityReached])

    // Setup animation hook
    const animation = useRouteAnimation({
      activities,
      config: {
        speed: 0.00015,
        pauseAtStops: 1500,
        followCamera: true,
      },
      onPositionChange: handlePositionChange,
      onActivityReached: handleActivityReached,
    })

    // Expose animation methods via ref
    useImperativeHandle(ref, () => ({
      play: animation.play,
      pause: animation.pause,
      reset: animation.reset,
      jumpToActivity: animation.jumpToActivity,
      state: animation.state,
      progress: animation.progress,
      currentActivityIndex: animation.currentActivityIndex,
    }), [animation])

    // Notify parent of state changes
    useEffect(() => {
      onStateChange?.(animation.state)
    }, [animation.state, onStateChange])

    // Load mapbox-gl dynamically
    useEffect(() => {
      let isMounted = true
      
      import("mapbox-gl").then((module) => {
        if (isMounted) {
          // Import CSS
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css"
          document.head.appendChild(link)
          
          setMapboxgl(module.default)
        }
      })
      
      return () => {
        isMounted = false
      }
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

      map.current.on("load", () => {
        setIsLoaded(true)
      })

      return () => {
        if (map.current) {
          map.current.remove()
          map.current = null
        }
      }
    }, [accessToken, mapboxgl])

    // Update markers, route, and avatar when day/activities change
    useEffect(() => {
      if (!map.current || !isLoaded || !mapboxgl) return

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      
      // Remove avatar marker
      if (avatarMarkerRef.current) {
        avatarMarkerRef.current.remove()
        avatarMarkerRef.current = null
      }

      // Remove existing route layers
      if (map.current.getLayer("route")) map.current.removeLayer("route")
      if (map.current.getLayer("route-glow")) map.current.removeLayer("route-glow")
      if (map.current.getSource("route")) map.current.removeSource("route")

      if (activities.length === 0) return

      // Get coordinates
      const coordinates = activities.map((a) => [a.coordinates.lng, a.coordinates.lat])

      // Add route source
      if (coordinates.length >= 2) {
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        })

        // Glow layer
        map.current.addLayer({
          id: "route-glow",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#0A84FF",
            "line-width": 12,
            "line-opacity": 0.2,
            "line-blur": 4,
          },
        })

        // Main route line
        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#0A84FF",
            "line-width": 4,
            "line-opacity": 0.9,
          },
        })
      }

      // Add activity markers
      activities.forEach((activity, index) => {
        const el = createActivityMarker(activity, index)
        
        const popup = new mapboxgl.Popup({
          offset: 30,
          closeButton: false,
          maxWidth: "280px",
        }).setHTML(createPopupContent(activity, index))

        const marker = new mapboxgl.Marker(el)
          .setLngLat([activity.coordinates.lng, activity.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current!)

        el.addEventListener("click", () => {
          onActivityClick?.(activity, index)
        })

        markersRef.current.push(marker)
      })

      // Create avatar marker
      avatarElementRef.current = createAvatarMarkerElement(false)
      avatarMarkerRef.current = new mapboxgl.Marker({
        element: avatarElementRef.current,
        anchor: "center",
      })
        .setLngLat([activities[0].coordinates.lng, activities[0].coordinates.lat])
        .addTo(map.current!)

      // Fit bounds
      if (coordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        coordinates.forEach((coord) => bounds.extend(coord as [number, number]))
        map.current.fitBounds(bounds, {
          padding: { top: 120, bottom: 200, left: 60, right: 60 },
          maxZoom: 15,
          duration: 1000,
        })
      }
    }, [activities, isLoaded, mapboxgl, onActivityClick])

    return (
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="w-full h-full" />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1117]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#c0c6d6] text-sm">Cargando mapa...</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

// Create activity marker element
function createActivityMarker(activity: TimelineActivity, index: number): HTMLDivElement {
  const color = getActivityColor(activity.type)
  const icon = activity.icon ?? ACTIVITY_ICONS[activity.type] ?? "place"
  
  const el = document.createElement("div")
  el.className = "activity-marker"
  el.style.cssText = `
    width: 44px;
    height: 44px;
    cursor: pointer;
    transition: transform 0.2s ease, z-index 0s;
    z-index: 1;
  `

  // Marker circle
  const circle = document.createElement("div")
  circle.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: ${color};
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  `

  // Icon
  const iconEl = document.createElement("span")
  iconEl.className = "material-symbols-outlined"
  iconEl.textContent = icon
  iconEl.style.cssText = `
    font-size: 20px;
    color: white;
    font-variation-settings: 'FILL' 1;
  `

  // Order badge
  const badge = document.createElement("div")
  badge.style.cssText = `
    position: absolute;
    top: -6px;
    right: -6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    color: #131315;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  `
  badge.textContent = String(index + 1)

  circle.appendChild(iconEl)
  circle.appendChild(badge)
  el.appendChild(circle)

  // Hover effects
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.15)"
    el.style.zIndex = "10"
  })
  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)"
    el.style.zIndex = "1"
  })

  return el
}

// Create popup content
function createPopupContent(activity: TimelineActivity, index: number): string {
  const color = getActivityColor(activity.type)
  const icon = activity.icon ?? ACTIVITY_ICONS[activity.type] ?? "place"
  
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; padding: 12px; min-width: 200px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: ${color}20;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span class="material-symbols-outlined" style="font-size: 20px; color: ${color}; font-variation-settings: 'FILL' 1;">${icon}</span>
        </div>
        <div>
          <div style="font-weight: 600; font-size: 14px; color: #131315;">${activity.name}</div>
          <div style="font-size: 11px; color: #666;">${activity.time} · ${activity.duration} min</div>
        </div>
      </div>
      <div style="font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
        <span class="material-symbols-outlined" style="font-size: 14px;">location_on</span>
        ${activity.location}
      </div>
      ${activity.cost > 0 ? `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          background: #22C55E15;
          color: #22C55E;
          font-size: 12px;
          font-weight: 600;
        ">
          €${activity.cost}
        </div>
      ` : ""}
    </div>
  `
}
