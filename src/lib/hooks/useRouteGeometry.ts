"use client"

import { useEffect, useState, useRef } from "react"

export type RouteMode = "foot" | "car" | "transit"

export interface RouteSegment {
  fromId: string
  toId: string
  coordinates: [number, number][] // [lat, lng]
  color: string
  mode: RouteMode // actual mode used for this segment
  distanceMeters?: number
  durationSeconds?: number
}

const cache = new Map<string, { coords: [number, number][]; distance?: number; duration?: number }>()

const OSRM_BASE = "https://router.project-osrm.org/route/v1"

/** Haversine distance in meters */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchRouteGeometry(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: "foot" | "car" = "foot"
): Promise<{ coords: [number, number][]; distance?: number; duration?: number } | null> {
  try {
    const osrmProfile = profile === "car" ? "driving" : "foot"
    const url = `${OSRM_BASE}/${osrmProfile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const route = data.routes?.[0]
    const coords = route?.geometry?.coordinates
    if (!coords) return null

    return {
      coords: coords.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
      distance: route.distance,
      duration: route.duration,
    }
  } catch {
    return null
  }
}

export interface GeoActivity {
  id: string
  type: string
  lat: number
  lng: number
}

export interface UseRouteGeometryOptions {
  /** User's preferred transport modes from onboarding */
  transportPrefs?: string[]
  /** Maximum comfortable walking distance in meters (from mobility profile) */
  maxWalkMeters?: number
}

/**
 * Determines the routing mode for a segment based on distance and user preferences.
 * - Short distances (< maxWalkMeters): always walk
 * - Long distances with transit pref: mark as transit (uses walking route as approximation)
 * - Long distances with car pref: use driving route
 * - Default: walk
 */
function resolveSegmentMode(
  distanceMeters: number,
  transportPrefs: string[],
  maxWalkMeters: number
): RouteMode {
  // Short segment — always walk
  if (distanceMeters <= maxWalkMeters) return "foot"

  // User prefers public transport
  if (transportPrefs.includes("publico") || transportPrefs.includes("mix")) return "transit"

  // User prefers car/taxi
  if (transportPrefs.includes("coche") || transportPrefs.includes("taxi")) return "car"

  // Default: walk anyway
  return "foot"
}

// Colors for different route modes
const MODE_COLORS: Record<RouteMode, string> = {
  foot: "#30D158",    // green — walking
  transit: "#32ADE6", // blue — public transport
  car: "#FF9F0A",     // orange — car/taxi
}

export function useRouteGeometry(
  activities: GeoActivity[],
  typeColors: Record<string, string>,
  options: UseRouteGeometryOptions = {}
) {
  const { transportPrefs = [], maxWalkMeters = 1500 } = options
  const [segments, setSegments] = useState<RouteSegment[]>([])
  const abortRef = useRef(false)

  // Stabilize prefs reference
  const prefsKey = transportPrefs.join(",")

  useEffect(() => {
    const valid = activities.filter(a => typeof a.lat === "number" && typeof a.lng === "number" && !isNaN(a.lat) && !isNaN(a.lng))
    if (valid.length < 2) {
      setSegments([])
      return
    }

    abortRef.current = false
    const result: RouteSegment[] = []
    const prefs = prefsKey ? prefsKey.split(",") : []

    async function fetchAll() {
      for (let i = 0; i < valid.length - 1; i++) {
        if (abortRef.current) break

        const from = valid[i]
        const to = valid[i + 1]
        const straightDist = haversineMeters(from.lat, from.lng, to.lat, to.lng)
        const mode = resolveSegmentMode(straightDist, prefs, maxWalkMeters)
        const osrmProfile = mode === "car" ? "car" : "foot" // transit uses foot route as visual path
        const key = `${osrmProfile}:${from.lat.toFixed(5)},${from.lng.toFixed(5)}->${to.lat.toFixed(5)},${to.lng.toFixed(5)}`

        let cached = cache.get(key) ?? null
        if (!cached) {
          cached = await fetchRouteGeometry(from.lat, from.lng, to.lat, to.lng, osrmProfile)
          if (cached) cache.set(key, cached)
        }

        if (cached && !abortRef.current) {
          result.push({
            fromId: from.id,
            toId: to.id,
            coordinates: cached.coords,
            color: MODE_COLORS[mode],
            mode,
            distanceMeters: cached.distance,
            durationSeconds: cached.duration,
          })
          setSegments([...result])
        }

        // Rate limit
        if (i < valid.length - 2 && !abortRef.current) {
          await new Promise(r => setTimeout(r, 200))
        }
      }
    }

    fetchAll()
    return () => { abortRef.current = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, prefsKey, maxWalkMeters])

  return segments
}
