"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { MagicMomentSuggestion } from "@/lib/magic-moment"

interface MagicMomentCardProps {
  suggestion: MagicMomentSuggestion
  onAccept: () => void
  onDismiss: () => void
  /** When true renders as a bottom-sheet popup instead of inline card */
  asPopup?: boolean
}

function formatDistance(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

export function MagicMomentCard({ suggestion, onAccept, onDismiss, asPopup = false }: MagicMomentCardProps) {
  const { poi, reason } = suggestion

  const content = (
    <div className={asPopup ? "p-5 pb-8" : "p-4"}>
      {/* Header badge */}
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="text-[22px]"
        >
          ✨
        </motion.span>
        <span
          className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: "rgba(191,90,242,0.15)", color: "#BF5AF2" }}
        >
          Momento mágico cercano
        </span>
        <span className="text-[10px] text-[#555] ml-auto flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">near_me</span>
          {formatDistance(poi.distanceMeters)}
        </span>
      </div>

      {/* POI info */}
      <div className="flex items-start gap-4 mb-4">
        <span className="text-[48px] shrink-0 leading-none">{poi.emoji ?? "📍"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[18px] font-black text-white leading-tight">{poi.name}</p>
          <p className="text-[12px] text-[#BF5AF2] mt-1 flex items-center gap-2">
            <span>{poi.durationMinutes} min</span>
            <span className="text-[#444]">·</span>
            <span>{formatDistance(poi.distanceMeters)} caminando</span>
          </p>
        </div>
      </div>

      {/* Description if available */}
      {poi.description && (
        <p className="text-[13px] text-[#c0c6d6] leading-relaxed mb-3 px-1">{poi.description}</p>
      )}

      {/* Reason text */}
      <p className="text-[12px] text-[#888] leading-relaxed mb-5 px-1">{reason}</p>

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAccept}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-[15px] text-white"
          style={{
            background: "linear-gradient(135deg, #BF5AF2, #5856D6)",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">near_me</span>
          Ir ahora · abrir en Maps
        </motion.button>
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl text-[13px] font-medium text-[#777] hover:text-[#aaa] transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          Seguir con el plan
        </button>
      </div>
    </div>
  )

  if (asPopup) {
    return (
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="magic-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        />
        {/* Bottom sheet */}
        <motion.div
          key="magic-sheet"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden max-w-lg mx-auto"
          style={{
            background: "linear-gradient(180deg, rgba(28,20,38,0.99) 0%, rgba(18,12,28,0.99) 100%)",
            border: "1px solid rgba(191,90,242,0.25)",
            borderBottom: "none",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Inline card (kept for backward compat but not used in plan page anymore)
  return (
    <AnimatePresence>
      <motion.div
        key={`magic-${poi.name}`}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="mx-5 mb-3 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(191,90,242,0.10) 0%, rgba(88,86,214,0.10) 100%)",
          border: "1px solid rgba(191,90,242,0.25)",
        }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}
