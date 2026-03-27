"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOnboardingStore } from "@/store/useOnboardingStore"
import { StepHeader } from "../ui/StepHeader"

export function CoreFinalizeStep() {
  const { data, setField, advancedExpanded, setAdvancedExpanded } = useOnboardingStore()

  return (
    <div>
      <StepHeader
        title="¿Algo más?"
        subtitle="Cuéntanos lo que no podemos ignorar"
        emoji="📝"
      />

      <div className="space-y-4">
        {/* First time toggle */}
        <div>
          <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-3">
            ¿Es tu primera vez en el destino?
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setField("firstTime", true)}
              className={`
                flex-1 py-3 px-4 rounded-2xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                ${data.firstTime === true
                  ? "border-[#0A84FF] bg-[#0A84FF]/15 text-[#0A84FF]"
                  : "border-white/8 bg-[rgba(31,31,33,0.9)] text-[#c0c6d6] hover:border-white/20"
                }
              `}
            >
              🆕 Primera vez
            </button>
            <button
              onClick={() => setField("firstTime", false)}
              className={`
                flex-1 py-3 px-4 rounded-2xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                ${data.firstTime === false
                  ? "border-[#0A84FF] bg-[#0A84FF]/15 text-[#0A84FF]"
                  : "border-white/8 bg-[rgba(31,31,33,0.9)] text-[#c0c6d6] hover:border-white/20"
                }
              `}
            >
              🔄 Ya conozco
            </button>
          </div>
        </div>

        {/* Must see */}
        <div>
          <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
            Lugares imprescindibles <span className="text-white/30 normal-case font-normal">(opcional)</span>
          </label>
          <div className="glass-panel p-4">
            <textarea
              rows={2}
              placeholder="Ej: La Sagrada Familia, el barrio gótico..."
              value={data.mustSee}
              onChange={(e) => setField("mustSee", e.target.value)}
              className="w-full bg-transparent text-[#e4e2e4] placeholder:text-[#c0c6d6]/50 text-sm resize-none"
            />
          </div>
        </div>

        {/* Must avoid */}
        <div>
          <label className="block text-xs font-medium text-[#c0c6d6] uppercase tracking-wider mb-2">
            ¿Algo que prefieras evitar? <span className="text-white/30 normal-case font-normal">(opcional)</span>
          </label>
          <div className="glass-panel p-4">
            <textarea
              rows={2}
              placeholder="Ej: Sitios masificados, museos, comida picante..."
              value={data.mustAvoid}
              onChange={(e) => setField("mustAvoid", e.target.value)}
              className="w-full bg-transparent text-[#e4e2e4] placeholder:text-[#c0c6d6]/50 text-sm resize-none"
            />
          </div>
        </div>

        {/* Advanced accordion */}
        <div className="mt-2">
          <button
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className={`
              w-full py-3.5 px-5 rounded-2xl border text-sm font-medium transition-all duration-200 flex items-center justify-between
              ${advancedExpanded
                ? "border-[#0A84FF]/40 bg-[#0A84FF]/8 text-[#0A84FF]"
                : "border-white/10 bg-[rgba(31,31,33,0.7)] text-[#c0c6d6] hover:border-white/20"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span>🎛️</span>
              <span>Personalizar más</span>
              <span className="text-xs opacity-60 font-normal ml-1">alojamiento, ritmo, dieta…</span>
            </div>
            <motion.span
              animate={{ rotate: advancedExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-base"
            >
              expand_more
            </motion.span>
          </button>

          <AnimatePresence>
            {advancedExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 rounded-2xl border border-[#0A84FF]/20 bg-[#0A84FF]/5">
                  <p className="text-xs text-[#0A84FF] font-medium mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Pulsa Continuar para configurar cada opción paso a paso
                  </p>
                  <p className="text-xs text-[#888] mb-3">
                    Se añadirán {9} pasos adicionales antes de generar tu itinerario.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { emoji: "🏨", label: "Alojamiento" },
                      { emoji: "🗺️", label: "Estilo viajero" },
                      { emoji: "⚡", label: "Ritmo" },
                      { emoji: "☀️", label: "Horarios" },
                      { emoji: "✨", label: "Caprichos" },
                      { emoji: "🥗", label: "Dieta" },
                      { emoji: "🚌", label: "Transporte" },
                      { emoji: "🌦️", label: "Clima" },
                      { emoji: "♿", label: "Movilidad" },
                    ].map((item) => (
                      <span key={item.label} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-[#c0c6d6] flex items-center gap-1.5">
                        {item.emoji} {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
