"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { ACTIVITY_ICONS } from "@/lib/constants"

interface GeocodedActivity {
  activity: {
    id: string
    name: string
    type: string
    location: string
    time: string
    duration: number
    cost: number
    notes?: string
    description?: string
  }
  lat: number
  lng: number
}

interface RealMapViewProps {
  geocoded: GeocodedActivity[]
  center: { lat: number; lng: number } | null
  loading: boolean
  selectedActivityId?: string | null
  onMarkerClick?: (activityId: string) => void
}

// Create numbered marker icons
function createNumberedIcon(index: number, isSelected: boolean, isFirst: boolean, isLast: boolean) {
  const color = isSelected
    ? "#0A84FF"
    : isFirst
    ? "#30D158"
    : isLast
    ? "#FF453A"
    : "#5856D6"

  const size = isSelected ? 36 : 28
  const fontSize = isSelected ? 14 : 11

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4)${isSelected ? `, 0 0 16px ${color}80` : ""};
        transition: all 0.2s ease;
      ">${index + 1}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

// Auto-fit map bounds when markers change
function FitBounds({ geocoded }: { geocoded: GeocodedActivity[] }) {
  const map = useMap()

  useEffect(() => {
    if (geocoded.length === 0) return

    const bounds = L.latLngBounds(geocoded.map((g) => [g.lat, g.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [geocoded, map])

  return null
}

// Fly to selected marker
function FlyToSelected({
  geocoded,
  selectedActivityId,
}: {
  geocoded: GeocodedActivity[]
  selectedActivityId?: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedActivityId) return

    const target = geocoded.find((g) => g.activity.id === selectedActivityId)
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { duration: 0.8 })
    }
  }, [selectedActivityId, geocoded, map])

  return null
}

export function RealMapView({
  geocoded,
  center,
  loading,
  selectedActivityId,
  onMarkerClick,
}: RealMapViewProps) {
  const defaultCenter = center ?? { lat: 40.4168, lng: -3.7038 } // Madrid fallback

  // Route polyline
  const routePositions = useMemo(
    () => geocoded.map((g) => [g.lat, g.lng] as [number, number]),
    [geocoded]
  )

  if (geocoded.length === 0 && !loading) {
    // Still render map with default center, just no markers yet
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        style={{ background: "#0f1117" }}
      >
        {/* Dark theme tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Auto-fit bounds */}
        <FitBounds geocoded={geocoded} />

        {/* Fly to selected */}
        <FlyToSelected geocoded={geocoded} selectedActivityId={selectedActivityId} />

        {/* Route line connecting activities in order */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#5856D6",
              weight: 3,
              opacity: 0.6,
              dashArray: "8, 8",
            }}
          />
        )}

        {/* Activity markers */}
        {geocoded.map((geo, index) => {
          const isSelected = geo.activity.id === selectedActivityId
          const isFirst = index === 0
          const isLast = index === geocoded.length - 1

          return (
            <Marker
              key={geo.activity.id}
              position={[geo.lat, geo.lng]}
              icon={createNumberedIcon(index, isSelected, isFirst, isLast)}
              eventHandlers={{
                click: () => onMarkerClick?.(geo.activity.id),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {geo.activity.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                    🕐 {geo.activity.time} · {geo.activity.duration}min
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    📍 {geo.activity.location}
                  </div>
                  {geo.activity.cost > 0 && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                      💰 €{geo.activity.cost}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute top-4 left-4 px-3 py-2 rounded-xl flex items-center gap-2 z-[1000]"
          style={{ background: "rgba(19,19,21,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="w-3 h-3 rounded-full bg-[#0A84FF] animate-pulse" />
          <span className="text-[11px] text-[#c0c6d6]">
            Geocodificando... ({geocoded.length} de ?)
          </span>
        </div>
      )}

      {/* Legend */}
      <div
        className="absolute left-4 bottom-4 px-3 py-2 rounded-xl flex items-center gap-3 z-[1000]"
        style={{
          background: "rgba(19,19,21,0.85)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
          <span className="text-[11px] text-[#c0c6d6]">Inicio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#5856D6]" />
          <span className="text-[11px] text-[#c0c6d6]">Ruta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" />
          <span className="text-[11px] text-[#c0c6d6]">Final</span>
        </div>
      </div>
    </div>
  )
}
