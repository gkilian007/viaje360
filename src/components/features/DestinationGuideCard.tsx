"use client"

import { useEffect, useState } from "react"
import type { DestinationGuide } from "@/lib/services/destination-guide.service"

interface DestinationGuideCardProps {
  destination: string
}

export function DestinationGuideCard({ destination }: DestinationGuideCardProps) {
  const [guide, setGuide] = useState<DestinationGuide | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [openSection, setOpenSection] = useState(0)

  useEffect(() => {
    let cancelled = false
    setGuide(null)
    setExpanded(false)
    setOpenSection(0)

    fetch(`/api/destination-guide?destination=${encodeURIComponent(destination)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return
        const sections = payload?.data?.guide?.sections
        if (Array.isArray(sections) && sections.length > 0) {
          setGuide(payload.data.guide as DestinationGuide)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [destination])

  if (!guide) return null

  return (
    <div className="px-5 mb-4">
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
      >
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center gap-3 text-left"
        >
          <span className="text-[20px] shrink-0">🧭</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--on-surface)]">Guía práctica</p>
            <p className="text-[11px] text-[var(--on-surface-variant)] truncate">
              Transporte, dinero, costumbres y más en {destination}
            </p>
          </div>
          <span
            className="material-symbols-outlined text-[18px] text-[var(--on-surface-variant)] shrink-0 transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "none" }}
          >
            expand_more
          </span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-1">
            {guide.sections.map((section, index) => {
              const isOpen = openSection === index
              return (
                <div
                  key={`${section.title}-${index}`}
                  className="rounded-xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? -1 : index)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <span className="text-[15px] shrink-0">{section.emoji}</span>
                    <span className="flex-1 text-[12px] font-medium text-[var(--on-surface)]">
                      {section.title}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[var(--on-surface-variant)] shrink-0">
                      {isOpen ? "remove" : "add"}
                    </span>
                  </button>
                  {isOpen && (
                    <ul className="px-3 pb-2.5 space-y-1.5">
                      {section.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-[11px] leading-relaxed text-[var(--on-surface-variant)] flex gap-1.5"
                        >
                          <span className="shrink-0 text-[#0A84FF]">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
