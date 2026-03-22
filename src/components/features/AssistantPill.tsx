"use client"

import Link from "next/link"

export function AssistantPill() {
  return (
    <Link href="/ai" className="block">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        style={{
          background: "rgba(19, 19, 21, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* AI icon */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
        >
          <span
            className="material-symbols-outlined text-[15px] text-white"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            smart_toy
          </span>
        </div>
        {/* Prompt text */}
        <span className="flex-1 text-[13px] text-[#c0c6d6]">
          Pregunta a tu asistente…
        </span>
        {/* Mic / send */}
        <span className="material-symbols-outlined text-[18px] text-[#0A84FF]">send</span>
      </div>
    </Link>
  )
}
