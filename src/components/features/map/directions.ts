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

// Turn-by-turn step
export interface DirectionStep {
  instruction: string
  distance: number // meters
  duration: number // seconds
  maneuver: {
    type: string
    modifier?: string
    bearing_after?: number
  }
}

// Route segment with directions data
export interface DirectionsSegment {
  from: Coordinate
  to: Coordinate
  mode: TransportMode
  distance: number // in meters
  duration: number // in seconds
  geometry: [number, number][] // actual route coordinates
  steps: DirectionStep[] // turn-by-turn instructions
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

// Get maneuver icon based on type
export function getManeuverIcon(maneuver: DirectionStep["maneuver"]): string {
  const type = maneuver.type
  const modifier = maneuver.modifier

  // Map maneuver types to Material icons
  const iconMap: Record<string, string> = {
    "turn-left": "turn_left",
    "turn-right": "turn_right",
    "turn-slight-left": "turn_slight_left",
    "turn-slight-right": "turn_slight_right",
    "turn-sharp-left": "turn_sharp_left",
    "turn-sharp-right": "turn_sharp_right",
    "uturn": "u_turn_left",
    "straight": "straight",
    "merge": "merge",
    "fork": "fork_right",
    "roundabout": "roundabout_right",
    "rotary": "roundabout_right",
    "depart": "trip_origin",
    "arrive": "flag",
  }

  // Check for modifier-based icons
  if (modifier) {
    const modifierKey = `${type}-${modifier}`.replace(/\s+/g, "-")
    if (iconMap[modifierKey]) return iconMap[modifierKey]
    
    // Check modifier alone
    if (modifier.includes("left")) return "turn_left"
    if (modifier.includes("right")) return "turn_right"
    if (modifier.includes("straight")) return "straight"
  }

  return iconMap[type] || "directions"
}

// Translate instruction to Spanish
export function translateInstruction(instruction: string): string {
  const translations: [RegExp, string][] = [
    [/^Turn left/i, "Gira a la izquierda"],
    [/^Turn right/i, "Gira a la derecha"],
    [/^Turn slight left/i, "Gira ligeramente a la izquierda"],
    [/^Turn slight right/i, "Gira ligeramente a la derecha"],
    [/^Turn sharp left/i, "Gira bruscamente a la izquierda"],
    [/^Turn sharp right/i, "Gira bruscamente a la derecha"],
    [/^Continue straight/i, "Continúa recto"],
    [/^Continue/i, "Continúa"],
    [/^Keep left/i, "Mantente a la izquierda"],
    [/^Keep right/i, "Mantente a la derecha"],
    [/^Head (north|south|east|west)/i, "Dirígete hacia el $1"],
    [/^Merge/i, "Incorpórate"],
    [/^Take the (.*) exit/i, "Toma la salida $1"],
    [/^Enter the roundabout/i, "Entra en la rotonda"],
    [/^Exit the roundabout/i, "Sal de la rotonda"],
    [/^At the roundabout/i, "En la rotonda"],
    [/^You have arrived/i, "Has llegado"],
    [/^Arrive/i, "Llegada"],
    [/onto (.+)$/i, "hacia $1"],
    [/on (.+)$/i, "por $1"],
    [/north/gi, "norte"],
    [/south/gi, "sur"],
    [/east/gi, "este"],
    [/west/gi, "oeste"],
  ]

  let translated = instruction
  for (const [pattern, replacement] of translations) {
    translated = translated.replace(pattern, replacement)
  }
  
  return translated
}

// Fetch directions from Mapbox API with steps
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

    // Request with steps=true for turn-by-turn
    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coordsString}?geometries=geojson&overview=full&steps=true&language=es&access_token=${accessToken}`

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

    // Build segments from legs with steps
    const segments: DirectionsSegment[] = legs.map((leg: any, i: number) => {
      const steps: DirectionStep[] = (leg.steps || []).map((step: any) => ({
        instruction: step.maneuver?.instruction || "",
        distance: step.distance || 0,
        duration: step.duration || 0,
        maneuver: {
          type: step.maneuver?.type || "straight",
          modifier: step.maneuver?.modifier,
          bearing_after: step.maneuver?.bearing_after,
        },
      }))

      return {
        from: coordinates[i],
        to: coordinates[i + 1],
        mode,
        distance: leg.distance || 0,
        duration: leg.duration || 0,
        geometry: extractLegGeometry(route.geometry.coordinates, i, legs.length),
        steps,
      }
    })

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
): { distance: number; duration: number; steps: DirectionStep[] } {
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

  // Create a simple fallback step
  const steps: DirectionStep[] = [{
    instruction: "Dirígete hacia tu destino",
    distance: walkingDistance,
    duration,
    maneuver: { type: "depart" },
  }]

  return { distance: walkingDistance, duration, steps }
}
