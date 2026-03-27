"use client"

import { useEffect, useState } from "react"
import type { ViatorProduct } from "@/app/api/viator/search/route"

interface ViatorToursProps {
  activityName: string
  destination: string
}

export function ViatorTours({ activityName, destination }: ViatorToursProps) {
  const [products, setProducts] = useState<ViatorProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = `${activityName} ${destination}`
    fetch(`/api/viator/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(res => setProducts(res.data?.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activityName, destination])

  if (loading) {
    return (
      <div className="mt-3">
        <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2 px-1">Tours disponibles</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2].map(i => (
            <div key={i} className="shrink-0 w-48 h-24 rounded-xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="mt-3">
      <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2 px-1">
        Tours en Viator
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {products.map(p => (
          <a
            key={p.productCode}
            href={p.bookingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="shrink-0 w-44 rounded-xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {p.thumbnailUrl && (
              <img src={p.thumbnailUrl} alt={p.title} className="w-full h-20 object-cover" />
            )}
            <div className="p-2.5 flex flex-col gap-1 flex-1">
              <p className="text-[11px] font-semibold text-white line-clamp-2 leading-tight">{p.title}</p>
              <div className="flex items-center gap-1.5 mt-auto">
                {p.rating > 0 && (
                  <span className="text-[10px] text-[#FF9F0A] flex items-center gap-0.5">
                    ⭐ {p.rating.toFixed(1)}
                  </span>
                )}
                {p.price.fromPrice > 0 && (
                  <span className="text-[10px] text-[#30D158] ml-auto font-semibold">
                    desde {p.price.fromPrice}€
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
