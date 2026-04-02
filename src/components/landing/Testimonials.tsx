"use client"

import { motion } from "framer-motion"

const TESTIMONIALS = [
  {
    name: "María G.",
    location: "Madrid → Roma",
    text: "Planifiqué mi viaje a Roma en 2 minutos. La IA me sugirió sitios que ni sabía que existían. ¡10/10!",
    avatar: "👩‍💼",
    rating: 5,
  },
  {
    name: "Carlos P.",
    location: "Barcelona → Tokio",
    text: "El mapa interactivo y las rutas a pie entre actividades me ahorraron horas de planificación manual.",
    avatar: "👨‍💻",
    rating: 5,
  },
  {
    name: "Laura & Tomás",
    location: "Sevilla → París",
    text: "Viajamos con niños y la app adaptó el itinerario automáticamente cuando llovió. Magia pura.",
    avatar: "👨‍👩‍👧",
    rating: 5,
  },
  {
    name: "Ana R.",
    location: "Valencia → Estambul",
    text: "El diario de viaje con fotos y recap automático es mi función favorita. Recuerdos para siempre.",
    avatar: "📸",
    rating: 5,
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-sm">★</span>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="py-20 px-4" style={{ background: "rgba(10,132,255,0.03)" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-3">Lo que dicen nuestros viajeros</h2>
          <p className="text-[#c0c6d6] text-sm max-w-md mx-auto">
            Miles de viajeros ya planifican con inteligencia artificial
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-white/[0.06]"
              style={{ background: "rgba(26,26,46,0.6)", backdropFilter: "blur(12px)" }}
            >
              <Stars count={t.rating} />
              <p className="text-[#e4e2e4] text-sm mt-3 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-[#0A84FF] text-xs">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social proof bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex items-center justify-center gap-8 flex-wrap text-center"
        >
          <div>
            <p className="text-2xl font-bold text-white">2,500+</p>
            <p className="text-[#c0c6d6] text-xs">Viajes planificados</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-2xl font-bold text-white">4.8 ★</p>
            <p className="text-[#c0c6d6] text-xs">Valoración media</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-2xl font-bold text-white">50+</p>
            <p className="text-[#c0c6d6] text-xs">Destinos cubiertos</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
