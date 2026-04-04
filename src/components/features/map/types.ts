import type { TimelineActivity } from "@/lib/types"

// Coordinate type
export interface Coordinate {
  lng: number
  lat: number
}

// Activity with coordinates
export interface ActivityWithCoords extends TimelineActivity {
  coordinates: Coordinate
}

// Animation state
export type AnimationState = "idle" | "playing" | "paused" | "finished"

// Animation config
export interface AnimationConfig {
  speed: number // pixels per frame
  pauseAtStops: number // ms to pause at each stop
  easing: "linear" | "easeInOut" | "easeOut"
  followCamera: boolean
  cameraZoom: number
}

// Route segment for animation calculations
export interface RouteSegment {
  from: Coordinate
  to: Coordinate
  distance: number
  bearing: number
  activityIndex: number
}

// Avatar position during animation
export interface AvatarPosition {
  coordinate: Coordinate
  bearing: number
  progress: number // 0-1 for entire route
  currentSegmentIndex: number
  isAtStop: boolean
  currentActivityIndex: number
}

// Default animation config
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  speed: 0.00008, // degrees per frame (adjust for visual speed)
  pauseAtStops: 1500,
  easing: "easeInOut",
  followCamera: true,
  cameraZoom: 15,
}

// Sample coordinates for Barcelona (fallback when real coords not available)
export const BARCELONA_COORDS: Record<string, Coordinate> = {
  "Check-in Hotel Arts": { lng: 2.1970, lat: 41.3879 },
  "Paseo por la Barceloneta": { lng: 2.1896, lat: 41.3784 },
  "Cena en El Nacional": { lng: 2.1683, lat: 41.3914 },
  "Sagrada Família": { lng: 2.1744, lat: 41.4036 },
  "Almuerzo en Cervecería Catalana": { lng: 2.1632, lat: 41.3936 },
  "Casa Batlló": { lng: 2.1650, lat: 41.3916 },
  "Park Güell": { lng: 2.1527, lat: 41.4145 },
  "Mercado de La Boqueria": { lng: 2.1719, lat: 41.3816 },
  default: { lng: 2.1734, lat: 41.3851 },
}

// City center coordinates for fallback
export const CITY_CENTERS: Record<string, Coordinate> = {
  "barcelona": { lng: 2.1734, lat: 41.3851 },
  "madrid": { lng: -3.7038, lat: 40.4168 },
  "paris": { lng: 2.3522, lat: 48.8566 },
  "parís": { lng: 2.3522, lat: 48.8566 },
  "roma": { lng: 12.4964, lat: 41.9028 },
  "rome": { lng: 12.4964, lat: 41.9028 },
  "london": { lng: -0.1276, lat: 51.5074 },
  "londres": { lng: -0.1276, lat: 51.5074 },
  "nueva york": { lng: -74.0060, lat: 40.7128 },
  "new york": { lng: -74.0060, lat: 40.7128 },
  "new york city": { lng: -74.0060, lat: 40.7128 },
  "nyc": { lng: -74.0060, lat: 40.7128 },
  "tokio": { lng: 139.6917, lat: 35.6895 },
  "tokyo": { lng: 139.6917, lat: 35.6895 },
  "amsterdam": { lng: 4.9041, lat: 52.3676 },
  "ámsterdam": { lng: 4.9041, lat: 52.3676 },
  "berlin": { lng: 13.4050, lat: 52.5200 },
  "berlín": { lng: 13.4050, lat: 52.5200 },
  "lisboa": { lng: -9.1393, lat: 38.7223 },
  "lisbon": { lng: -9.1393, lat: 38.7223 },
  "praga": { lng: 14.4378, lat: 50.0755 },
  "prague": { lng: 14.4378, lat: 50.0755 },
  "viena": { lng: 16.3738, lat: 48.2082 },
  "vienna": { lng: 16.3738, lat: 48.2082 },
  "estambul": { lng: 28.9784, lat: 41.0082 },
  "istanbul": { lng: 28.9784, lat: 41.0082 },
  "dubai": { lng: 55.2708, lat: 25.2048 },
  "dubái": { lng: 55.2708, lat: 25.2048 },
  "bangkok": { lng: 100.5018, lat: 13.7563 },
  "singapore": { lng: 103.8198, lat: 1.3521 },
  "singapur": { lng: 103.8198, lat: 1.3521 },
  "sydney": { lng: 151.2093, lat: -33.8688 },
  "sídney": { lng: 151.2093, lat: -33.8688 },
  "buenos aires": { lng: -58.3816, lat: -34.6037 },
  "mexico city": { lng: -99.1332, lat: 19.4326 },
  "ciudad de méxico": { lng: -99.1332, lat: 19.4326 },
  "san francisco": { lng: -122.4194, lat: 37.7749 },
  "los angeles": { lng: -118.2437, lat: 34.0522 },
  "miami": { lng: -80.1918, lat: 25.7617 },
  "chicago": { lng: -87.6298, lat: 41.8781 },
  "florencia": { lng: 11.2558, lat: 43.7696 },
  "florence": { lng: 11.2558, lat: 43.7696 },
  "venecia": { lng: 12.3155, lat: 45.4408 },
  "venice": { lng: 12.3155, lat: 45.4408 },
  "milán": { lng: 9.1900, lat: 45.4654 },
  "milan": { lng: 9.1900, lat: 45.4654 },
  "múnich": { lng: 11.5820, lat: 48.1351 },
  "munich": { lng: 11.5820, lat: 48.1351 },
  "copenhague": { lng: 12.5683, lat: 55.6761 },
  "copenhagen": { lng: 12.5683, lat: 55.6761 },
  "edimburgo": { lng: -3.1883, lat: 55.9533 },
  "edinburgh": { lng: -3.1883, lat: 55.9533 },
  "budapest": { lng: 19.0402, lat: 47.4979 },
  "bruselas": { lng: 4.3517, lat: 50.8503 },
  "brussels": { lng: 4.3517, lat: 50.8503 },
  "zurich": { lng: 8.5417, lat: 47.3769 },
  "zúrich": { lng: 8.5417, lat: 47.3769 },
  "seoul": { lng: 126.9780, lat: 37.5665 },
  "seúl": { lng: 126.9780, lat: 37.5665 },
  "osaka": { lng: 135.5023, lat: 34.6937 },
  "hanoi": { lng: 105.8412, lat: 21.0245 },
  "hanói": { lng: 105.8412, lat: 21.0245 },
  "bali": { lng: 115.1889, lat: -8.4095 },
  "marrakech": { lng: -7.9811, lat: 31.6295 },
  "cairo": { lng: 31.2357, lat: 30.0444 },
  "el cairo": { lng: 31.2357, lat: 30.0444 },
  "cape town": { lng: 18.4241, lat: -33.9249 },
  "ciudad del cabo": { lng: 18.4241, lat: -33.9249 },
  "kyoto": { lng: 135.7681, lat: 35.0116 },
  "kioto": { lng: 135.7681, lat: 35.0116 },
  "default": { lng: 0, lat: 20 }, // neutral world center, not Barcelona
}

// Aliases for common destination name variations
const CITY_ALIASES: Record<string, string> = {
  "ny": "new york",
  "nyc": "new york",
  "cdmx": "ciudad de méxico",
  "la": "los angeles",
  "l.a.": "los angeles",
}

// Get city center from destination name
export function getCityCenter(destination?: string): Coordinate {
  if (!destination) return CITY_CENTERS.default
  const normalizedDest = destination.toLowerCase().trim().replace(/[.,]/g, "")
  const resolved = CITY_ALIASES[normalizedDest] ?? normalizedDest
  // Exact match
  if (CITY_CENTERS[resolved]) return CITY_CENTERS[resolved]
  // Partial match (e.g. "New York, USA" → "new york")
  const partialMatch = Object.keys(CITY_CENTERS).find(
    (k) => k !== "default" && (resolved.startsWith(k) || resolved.includes(k))
  )
  return partialMatch ? CITY_CENTERS[partialMatch] : CITY_CENTERS.default
}

// Activity type to color mapping
export const ACTIVITY_COLORS: Record<string, string> = {
  hotel: "#8B5CF6",
  restaurant: "#F97316",
  monument: "#EAB308",
  museum: "#EC4899",
  park: "#22C55E",
  shopping: "#F43F5E",
  tour: "#0EA5E9",
  transport: "#64748B",
  default: "#0A84FF",
}

export function getActivityColor(type: string): string {
  return ACTIVITY_COLORS[type] || ACTIVITY_COLORS.default
}

// Get coordinates for an activity (with dynamic fallback based on destination)
export function getActivityCoordinates(activity: TimelineActivity, destination?: string): Coordinate {
  // Check if activity has real coordinates (from API like Google Places)
  if ((activity as any).coordinates) {
    const coords = (activity as any).coordinates
    if (typeof coords.lng === "number" && typeof coords.lat === "number") {
      return coords
    }
  }
  
  // Check if activity has lat/lng properties directly
  if ((activity as any).lat && (activity as any).lng) {
    return { lng: (activity as any).lng, lat: (activity as any).lat }
  }
  
  // Check for predefined coords by name (Barcelona specific)
  const predefined = BARCELONA_COORDS[activity.name]
  if (predefined) return predefined
  
  // Get city center for dynamic offset
  const cityCenter = getCityCenter(destination)
  
  // Generate deterministic offset based on activity id
  // This ensures same activity always gets same coords
  const hash = activity.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const offsetLng = ((hash % 100) - 50) * 0.0004
  const offsetLat = (((hash * 7) % 100) - 50) * 0.0003
  
  return {
    lng: cityCenter.lng + offsetLng,
    lat: cityCenter.lat + offsetLat,
  }
}

// Calculate bearing between two points (in degrees)
export function calculateBearing(from: Coordinate, to: Coordinate): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const lat1 = from.lat * Math.PI / 180
  const lat2 = to.lat * Math.PI / 180
  
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

// Calculate distance between two coordinates (in degrees, approximate)
export function calculateDistance(from: Coordinate, to: Coordinate): number {
  const dLng = to.lng - from.lng
  const dLat = to.lat - from.lat
  return Math.sqrt(dLng * dLng + dLat * dLat)
}

// Build route segments from activities
export function buildRouteSegments(activities: ActivityWithCoords[]): RouteSegment[] {
  const segments: RouteSegment[] = []
  
  for (let i = 0; i < activities.length - 1; i++) {
    const from = activities[i].coordinates
    const to = activities[i + 1].coordinates
    
    segments.push({
      from,
      to,
      distance: calculateDistance(from, to),
      bearing: calculateBearing(from, to),
      activityIndex: i,
    })
  }
  
  return segments
}

// Easing functions
export const easingFunctions = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
}

// Interpolate position along a segment
export function interpolatePosition(
  segment: RouteSegment,
  progress: number, // 0-1 within this segment
  easing: keyof typeof easingFunctions = "linear"
): Coordinate {
  const easedProgress = easingFunctions[easing](progress)
  
  return {
    lng: segment.from.lng + (segment.to.lng - segment.from.lng) * easedProgress,
    lat: segment.from.lat + (segment.to.lat - segment.from.lat) * easedProgress,
  }
}
