"use client"

import { useMemo } from "react"
import { buildGoogleFlightsUrl, buildKiwiFlightsUrl } from "@/lib/affiliate"

interface FlightLinksCardProps {
  destination: string
  country?: string | null
  startDate?: string | null
  endDate?: string | null
}

export function FlightLinksCard({ destination, country, startDate, endDate }: FlightLinksCardProps) {
  const start = startDate?.slice(0, 10)
  const end = endDate?.slice(0, 10)

  const links = useMemo(() => {
    if (!start || !end) return []
    const result = [
      { label: "Google Flights", url: buildGoogleFlightsUrl(destination, start, end) },
    ]
    // Kiwi's search slug requires the country; without it the link lands on the homepage
    if (country?.trim()) {
      result.push({ label: "Kiwi.com", url: buildKiwiFlightsUrl(destination, country.trim(), start, end) })
    }
    return result
  }, [destination, country, start, end])

  if (links.length === 0) return null

  return (
    <div className="px-5 mb-4">
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[20px] shrink-0">✈️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--on-surface)]">¿Cómo llegar?</p>
            <p className="text-[11px] text-[var(--on-surface-variant)]">
              Compara vuelos a {destination} para tus fechas
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold text-white bg-[#0A84FF]"
            >
              {link.label}
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
