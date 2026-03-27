const OSRM_BASE = "https://router.project-osrm.org/route/v1/walking"

interface DirectionsResult {
  walkingMinutes: number
  distanceMeters: number
  mapsUrl: string
}

export async function getWalkingDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DirectionsResult | null> {
  try {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
    if (!res.ok) return null

    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null

    const distanceMeters = Math.round(route.distance)

    // OSRM sometimes returns unrealistically low durations for short urban segments.
    // Sanity check: walking speed must be between 2 km/h (slow tourist) and 6 km/h (fast walk).
    // If OSRM result violates this, use distance-based estimate at 4.5 km/h tourist pace.
    const osrmMinutes = route.duration / 60
    const minMinutes = (distanceMeters / 1000) / 6 * 60   // 6 km/h max
    const maxMinutes = (distanceMeters / 1000) / 2 * 60   // 2 km/h min
    const sanitizedMinutes = osrmMinutes < minMinutes || osrmMinutes > maxMinutes
      ? (distanceMeters / 1000) / 4.5 * 60
      : osrmMinutes
    const walkingMinutes = Math.max(1, Math.ceil(sanitizedMinutes))
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=walking`

    return { walkingMinutes, distanceMeters, mapsUrl }
  } catch {
    return null
  }
}
