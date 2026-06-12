"use client"

import { useMemo } from "react"
import { buildBookingUrl } from "@/lib/affiliate"

interface WhereToStayCardProps {
  destination: string
  startDate?: string | null
  endDate?: string | null
  /** Accommodation zone saved during onboarding for this trip, if any */
  savedZone?: string | null
}

export function WhereToStayCard({ destination, startDate, endDate, savedZone }: WhereToStayCardProps) {
  const bookingUrl = useMemo(
    () => buildBookingUrl(destination, startDate?.slice(0, 10), endDate?.slice(0, 10)),
    [destination, startDate, endDate]
  )

  if (savedZone) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${savedZone} ${destination}`)}`
    return (
      <div className="px-5 mb-4">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
        >
          <span className="text-[20px] shrink-0">🛏️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-0.5">Tu alojamiento</p>
            <p className="text-[13px] font-semibold text-[var(--on-surface)] truncate">{savedZone}</p>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#0A84FF]"
          >
            Ver en mapa
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 mb-4">
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[20px] shrink-0">🛏️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--on-surface)]">¿Dónde dormir?</p>
            <p className="text-[11px] text-[var(--on-surface-variant)]">
              Encuentra alojamiento en {destination} para tus fechas
            </p>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold text-white bg-[#0A84FF]"
          >
            Buscar
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
        <p className="text-[9px] text-[#555] mt-2 leading-relaxed">
          * Viaje360 puede recibir una pequeña comisión si reservas a través de este enlace, sin coste adicional para ti.
        </p>
      </div>
    </div>
  )
}
