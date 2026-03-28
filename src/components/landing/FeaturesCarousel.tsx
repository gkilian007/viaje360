"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

const features = [
  {
    icon: "🗺️",
    title: "Mapa interactivo",
    description: "Visualiza tu ruta completa con markers y distancias reales entre actividades",
  },
  {
    icon: "⏰",
    title: "Tiempos de caminata",
    description: "Sabe exactamente cuánto tardarás entre cada parada",
  },
  {
    icon: "🌧️",
    title: "Se adapta al clima",
    description: "Si llueve, tu plan cambia automáticamente a actividades cubiertas",
  },
  {
    icon: "📔",
    title: "Diario de viaje",
    description: "Guarda tus mejores momentos y crea un recuerdo digital",
  },
  {
    icon: "💡",
    title: "Momentos mágicos",
    description: "Descubre joyas ocultas cerca de ti que no aparecen en las guías",
  },
]

export function FeaturesCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })

  // Cards travel from right to left: total width = 5 cards * ~420px
  // We want to scroll from showing card 1 to showing card 5
  const rawX = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "-75%"])
  const x = useSpring(rawX, { stiffness: 80, damping: 25, restDelta: 0.001 })

  // Progress dots
  const activeIdx = useTransform(scrollYProgress, [0, 1], [0, features.length - 1])

  return (
    <section ref={ref} className="relative" style={{ height: "400vh" }}>
      {/* Sticky container — stays pinned while user scrolls through the 400vh */}
      <div className="sticky top-0 h-screen overflow-hidden bg-[#131315] flex flex-col">
        {/* Title */}
        <div className="pt-16 pb-6 text-center px-6 flex-shrink-0">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-3"
          >
            Todo lo que necesitas
          </motion.h2>
          <p className="text-gray-400 text-lg">Herramientas diseñadas para el viajero moderno</p>
        </div>

        {/* Horizontal scroll track */}
        <div className="flex-1 flex items-center overflow-hidden">
          <motion.div
            className="flex gap-8 pl-[8vw] pr-[30vw]"
            style={{ x, willChange: "transform" }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="flex-shrink-0 w-[80vw] sm:w-[400px] rounded-3xl p-8 flex flex-col justify-between"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  minHeight: "300px",
                }}
              >
                <div>
                  <div className="text-5xl mb-6">{f.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{f.description}</p>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#5856D6]" />
                  <span className="text-gray-500 text-sm">Viaje360</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Progress dots */}
        <div className="flex-shrink-0 pb-10 flex justify-center gap-3">
          {features.map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: useTransform(
                  activeIdx,
                  [i - 0.5, i, i + 0.5],
                  ["rgba(255,255,255,0.2)", "rgba(10,132,255,1)", "rgba(255,255,255,0.2)"]
                ),
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
