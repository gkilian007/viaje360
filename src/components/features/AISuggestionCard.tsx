"use client"

import type { AISuggestion } from "@/lib/types"

interface AISuggestionCardProps {
  suggestion: AISuggestion
}

export function AISuggestionCard({ suggestion }: AISuggestionCardProps) {
  return (
    <div
      className="shrink-0 w-48 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      style={{
        background: "rgba(42, 42, 44, 0.9)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Image / gradient header */}
      <div
        className={`h-20 bg-gradient-to-br ${suggestion.imageColor ?? "from-blue-600 to-purple-700"} relative`}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>
      {/* Content */}
      <div className="p-3">
        <p className="text-[13px] font-semibold text-white leading-tight">{suggestion.title}</p>
        <p className="text-[11px] text-[#c0c6d6] mt-0.5">{suggestion.subtitle}</p>
        {suggestion.cta && (
          <button
            className="mt-2 w-full py-1.5 rounded-full text-[11px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#0A84FF" }}
          >
            {suggestion.cta}
          </button>
        )}
      </div>
    </div>
  )
}
