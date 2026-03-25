"use client"

import { motion } from "framer-motion"
import Link from "next/link"

const FEATURES = [
  {
    icon: "auto_awesome",
    title: "Itinerarios con IA",
    description: "Genera planes día a día personalizados con inteligencia artificial. Actividades reales, horarios optimizados y recomendaciones accionables.",
  },
  {
    icon: "map",
    title: "Mapa interactivo",
    description: "Visualiza tu ruta completa en un mapa con marcadores por tipo de actividad, popups detallados y navegación fluida.",
  },
  {
    icon: "psychology",
    title: "Aprende de ti",
    description: "El sistema recuerda tus preferencias, feedback y experiencias para mejorar cada plan que genera.",
  },
  {
    icon: "edit_note",
    title: "Diario de viaje",
    description: "Registra tu día con un diario conversacional. Tu mood, energía y opiniones alimentan futuras recomendaciones.",
  },
  {
    icon: "thumb_up",
    title: "Feedback en tiempo real",
    description: "¿Te gusta una actividad? ¿Prefieres menos museos? Tu feedback adapta el itinerario sobre la marcha.",
  },
  {
    icon: "lock",
    title: "Fija lo que importa",
    description: "Bloquea actividades que no quieres que cambien al adaptar el plan. El resto se ajusta alrededor.",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

export default function LandingPage() {
  // Landing page component — loaded dynamically for unauthenticated visitors
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e4e2e4] overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-[#0f1117]/80 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(10,132,255,0.3), rgba(88,86,214,0.3))",
              border: "1px solid rgba(10,132,255,0.25)",
            }}
          >
            <span className="text-[22px]">✈️</span>
          </div>
          <span className="text-[17px] font-bold tracking-tight">Viaje360</span>
        </div>

        <Link
          href="/login"
          className="px-5 py-2 rounded-full text-[13px] font-semibold transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #0A84FF, #5856D6)",
          }}
        >
          Sign In
        </Link>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium text-[#0A84FF] mb-6" style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.15)" }}>
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Impulsado por inteligencia artificial
            </div>

            <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-[1.08] tracking-tight">
              Tu viaje perfecto,{" "}
              <span className="bg-gradient-to-r from-[#0A84FF] to-[#5856D6] bg-clip-text text-transparent">
                planificado por IA
              </span>
            </h1>

            <p className="mt-5 text-[16px] leading-relaxed text-[#9ca3af] max-w-lg mx-auto lg:mx-0">
              Genera itinerarios detallados, adapta tu plan en tiempo real y deja que la app aprenda de tus gustos para cada viaje.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/onboarding"
                className="px-7 py-3.5 rounded-full text-[14px] font-semibold text-white transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
              >
                Planifica tu viaje gratis
              </Link>
              <a
                href="#features"
                className="px-7 py-3.5 rounded-full text-[14px] font-medium text-[#c0c6d6] transition-all hover:text-white"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Ver características
              </a>
            </div>
          </motion.div>

          {/* Phone mockups */}
          <motion.div
            className="flex-1 flex items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Phone 1 */}
            <div className="relative w-[200px] sm:w-[220px] shrink-0">
              <div
                className="rounded-[2rem] overflow-hidden shadow-2xl"
                style={{
                  border: "3px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 30px 80px rgba(10,132,255,0.15), 0 10px 30px rgba(0,0,0,0.4)",
                }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full block"
                  poster=""
                >
                  <source src="/demo-video1.webm" type="video/webm" />
                  <source src="/demo-video1.mp4" type="video/mp4" />
                </video>
              </div>
            </div>

            {/* Phone 2 — offset up */}
            <div className="relative w-[200px] sm:w-[220px] shrink-0 -mt-12">
              <div
                className="rounded-[2rem] overflow-hidden shadow-2xl"
                style={{
                  border: "3px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 30px 80px rgba(88,86,214,0.15), 0 10px 30px rgba(0,0,0,0.4)",
                }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full block"
                  poster=""
                >
                  <source src="/demo-video2.webm" type="video/webm" />
                  <source src="/demo-video2.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[clamp(1.5rem,3vw,2.4rem)] font-bold tracking-tight">
            Todo lo que necesitas para viajar mejor
          </h2>
          <p className="mt-3 text-[15px] text-[#9ca3af] max-w-md mx-auto">
            Planifica, adapta y recuerda cada viaje con herramientas diseñadas para viajeros reales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(28,28,30,0.6)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(10,132,255,0.12)",
                  border: "1px solid rgba(10,132,255,0.15)",
                }}
              >
                <span className="material-symbols-outlined text-[20px] text-[#0A84FF]">
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold mb-2">{feature.title}</h3>
              <p className="text-[13px] text-[#9ca3af] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-2xl mx-auto text-center p-10 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(10,132,255,0.08), rgba(88,86,214,0.08))",
            border: "1px solid rgba(10,132,255,0.12)",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-bold mb-3">
            ¿Listo para tu próximo viaje?
          </h2>
          <p className="text-[14px] text-[#9ca3af] mb-8 max-w-md mx-auto">
            Empieza a planificar gratis. Sin tarjeta, sin compromisos.
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
          >
            Empieza ahora →
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[16px]">✈️</span>
            <span className="text-[13px] font-medium text-[#666]">Viaje360</span>
          </div>
          <p className="text-[11px] text-[#666]">
            © {new Date().getFullYear()} Viaje360. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
