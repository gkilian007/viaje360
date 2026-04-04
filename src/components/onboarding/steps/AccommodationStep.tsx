"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"

// Leaflet dynamic import (no SSR)
const HotelMapPicker = dynamic(() => import("./HotelMapPicker").then(m => m.HotelMapPicker), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] rounded-2xl bg-white/5 flex items-center justify-center">
      <span className="text-sm text-[#c0c6d6]">Cargando mapa...</span>
    </div>
  ),
})

export function AccommodationStep() {
  const { data, setField } = useOnboardingStore()
  const [showMap, setShowMap] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ name: string; lat: number; lng: number }>>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Search for hotel suggestions using the geocode API
  const handleInputChange = useCallback((value: string) => {
    setField("accommodationZone", value)
    setField("accommodationLat", null)
    setField("accommodationLng", null)

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.trim().length < 3) {
      setSearchSuggestions([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const near = data.destination ? `&near=${encodeURIComponent(data.destination)}` : ""
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}${near}`)
        const json = await res.json()
        if (json.data) {
          setSearchSuggestions([{ name: value, lat: json.data.lat, lng: json.data.lng }])
        }
      } catch {}
      setSearching(false)
    }, 400)
  }, [data.destination, setField])

  const handleSelectSuggestion = (suggestion: { name: string; lat: number; lng: number }) => {
    setField("accommodationZone", suggestion.name)
    setField("accommodationLat", suggestion.lat)
    setField("accommodationLng", suggestion.lng)
    setSearchSuggestions([])
    setShowMap(true)
  }

  const handleMapPin = (lat: number, lng: number) => {
    setField("accommodationLat", lat)
    setField("accommodationLng", lng)
  }

  const hasPinned = !!(data.accommodationLat && data.accommodationLng)

  return (
    <div>
      <StepHeader
        title="¿Dónde te alojas?"
        subtitle="Optimizamos rutas desde tu alojamiento"
        emoji="🏨"
      />

      {/* Search input */}
      <div className="relative">
        <div className="glass-pill px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0A84FF] text-xl">hotel</span>
          <input
            type="text"
            placeholder="Nombre del hotel o barrio..."
            value={data.accommodationZone}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 bg-transparent text-[#e4e2e4] placeholder:text-[#c0c6d6]/50 text-sm"
          />
          {searching && (
            <span className="material-symbols-outlined text-[#c0c6d6] text-lg animate-spin">progress_activity</span>
          )}
          {hasPinned && (
            <span className="material-symbols-outlined text-[#30D158] text-lg">check_circle</span>
          )}
        </div>

        {/* Suggestions dropdown */}
        {searchSuggestions.length > 0 && (
          <div
            className="absolute z-10 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden"
            style={{
              background: "rgba(30,30,34,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {searchSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[#0A84FF] text-[18px]">location_on</span>
                <div>
                  <p className="text-sm text-[#e4e2e4]">{s.name}</p>
                  <p className="text-xs text-[#c0c6d6]">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map toggle / confirm button */}
      {data.accommodationZone.trim().length > 0 && (
        <button
          onClick={() => setShowMap(!showMap)}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
          style={{
            background: showMap ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${showMap ? "rgba(10,132,255,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: showMap ? "#0A84FF" : "#c0c6d6",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">
            {showMap ? "expand_less" : "map"}
          </span>
          {showMap ? "Ocultar mapa" : hasPinned ? "✓ Ubicación confirmada — ver mapa" : "Confirmar ubicación en el mapa"}
        </button>
      )}

      {/* Map */}
      {showMap && (
        <div className="mt-3 rounded-2xl overflow-hidden" style={{ height: 220 }}>
          <HotelMapPicker
            destination={data.destination}
            initialQuery={data.accommodationZone}
            pinLat={data.accommodationLat ?? undefined}
            pinLng={data.accommodationLng ?? undefined}
            onPin={handleMapPin}
          />
        </div>
      )}

      <p className="mt-4 text-xs text-[#c0c6d6]/60 text-center">
        {hasPinned
          ? "📍 Ubicación guardada — las rutas saldrán desde aquí"
          : "Puedes dejarlo en blanco y añadirlo más tarde"}
      </p>
    </div>
  )
}
