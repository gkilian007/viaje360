import type { Coordinate } from "./types"

// Transport modes supported by Mapbox Directions
export type TransportMode = "walking" | "cycling" | "driving"

export interface TransportModeInfo {
  id: TransportMode
  label: string
  icon: string
  color: string
}

export const TRANSPORT_MODES: TransportModeInfo[] = [
  { id: "walking", label: "A pie", icon: "directions_walk", color: "#30D158" },
  { id: "cycling", label: "Bici", icon: "directions_bike", color: "#FF9F0A" },
  { id: "driving", label: "Auto", icon: "directions_car", color: "#0A84FF" },
]

// Route segment with directions data
export interface DirectionsSegment {
  from: Coordinate
  to: Coordinate
  mode: TransportMode
  distance: number // in meters
  duration: number // in seconds
  geometry: [number, number][] // actual route coordinates
}

// Route summary
export interface RouteSummary {
  totalDistance: number // meters
  totalDuration: number // seconds
  segments: DirectionsSegment[]
}

// Format duration for display
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// Fetch directions from Mapbox API
export async function fetchDirections(
  coordinates: Coordinate[],
  mode: TransportMode,
  accessToken: string
): Promise<RouteSummary | null> {
  if (coordinates.length < 2) return null

  try {
    // Build coordinates string for API
    const coordsString = coordinates
      .map((c) => `${c.lng},${c.lat}`)
      .join(";")

    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coordsString}?geometries=geojson&overview=full&steps=false&access_token=${accessToken}`

    const response = await fetch(url)
    if (!response.ok) {
      console.error("Directions API error:", response.status)
      return null
    }

    const data = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      return null
    }

    const route = data.routes[0]
    const legs = route.legs || []

    // Build segments from legs
    const segments: DirectionsSegment[] = legs.map((leg: any, i: number) => ({
      from: coordinates[i],
      to: coordinates[i + 1],
      mode,
      distance: leg.distance || 0,
      duration: leg.duration || 0,
      geometry: extractLegGeometry(route.geometry.coordinates, i, legs.length),
    }))

    return {
      totalDistance: route.distance || 0,
      totalDuration: route.duration || 0,
      segments,
    }
  } catch (error) {
    console.error("Error fetching directions:", error)
    return null
  }
}

// Extract geometry for a specific leg (approximate split)
function extractLegGeometry(
  fullCoordinates: [number, number][],
  legIndex: number,
  totalLegs: number
): [number, number][] {
  if (totalLegs <= 1) return fullCoordinates
  
  const segmentLength = Math.floor(fullCoordinates.length / totalLegs)
  const start = legIndex * segmentLength
  const end = legIndex === totalLegs - 1 
    ? fullCoordinates.length 
    : (legIndex + 1) * segmentLength + 1
  
  return fullCoordinates.slice(start, end)
}

// Get estimated time between two points (fallback when API unavailable)
export function estimateTime(
  from: Coordinate,
  to: Coordinate,
  mode: TransportMode
): { distance: number; duration: number } {
  // Calculate straight-line distance in meters (approximate)
  const R = 6371000 // Earth's radius in meters
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLon = (to.lng - from.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Estimate walking distance (straight line * 1.3 for street grid)
  const walkingDistance = distance * 1.3

  // Average speeds in m/s
  const speeds: Record<TransportMode, number> = {
    walking: 1.4, // ~5 km/h
    cycling: 4.2, // ~15 km/h
    driving: 8.3, // ~30 km/h (city average)
  }

  const duration = walkingDistance / speeds[mode]

  return { distance: walkingDistance, duration }
}
