"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useOnboardingStore } from "@/store/useOnboardingStore"

const messages = [
  "Analizando tu destino...",
  "Optimizando rutas...",
  "Buscando los mejores sitios...",
  "Personalizando tu experiencia...",
  "¡Casi listo!",
]

export function GeneratingStep() {
  const router = useRouter()
  const { completeOnboarding } = useOnboardingStore()
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => {
        if (i < messages.length - 1) return i + 1
        clearInterval(interval)
        return i
      })
    }, 800)

    const timeout = setTimeout(() => {
      completeOnboarding()
      router.replace("/plan")
    }, 4200)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [completeOnboarding, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen map-bg px-6">
      {/* Logo / Icon */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="mb-10"
      >
        <div className="w-24 h-24 rounded-3xl bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center glow-blue">
          <span className="material-symbols-outlined text-[#0A84FF] text-5xl filled">travel_explore</span>
        </div>
      </motion.div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-[#e4e2e4] mb-2 text-center">
        Generando tu itinerario
      </h1>
      <p className="text-sm text-[#c0c6d6] mb-10 text-center">
        Nuestro AI está creando una experiencia única para ti
      </p>

      {/* Animated message */}
      <div className="h-8 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-[#0A84FF] font-medium text-base"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {messages.map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            animate={{
              backgroundColor: i <= messageIndex ? "#0A84FF" : "rgba(255,255,255,0.15)",
              scale: i === messageIndex ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}
