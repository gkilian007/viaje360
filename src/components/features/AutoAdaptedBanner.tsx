"use client"

import { motion, AnimatePresence } from "framer-motion"

interface AutoAdaptedBannerProps {
  days: number[]
  onDismiss: () => void
}

export function AutoAdaptedBanner({ days, onDismiss }: AutoAdaptedBannerProps) {
  if (days.length === 0) return null

  const dayList = days.length === 1
    ? `el día ${days[0]}`
    : `los días ${days.slice(0, -1).join(", ")} y ${days[days.length - 1]}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="mx-5 mb-3 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10,132,255,0.08)",
          border: "1px solid rgba(10,132,255,0.18)",
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-[28px] shrink-0 leading-none mt-0.5">🌧️✨</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-[14px] font-bold text-white">Itinerario adaptado automáticamente</p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(48,209,88,0.15)", color: "#30D158" }}
                >
                  Hecho
                </span>
              </div>
              <p className="text-[12px] text-[#aaa] leading-relaxed">
                Detectamos alta probabilidad de lluvia para {dayList}. Hemos reorganizado las actividades
                al aire libre por alternativas cubiertas igual de interesantes. 🏛️
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="text-[#444] hover:text-[#888] transition-colors shrink-0 -mt-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
