"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

// Feature cards that "pop out" in the final section
const features = [
  { emoji: "🤖", title: "IA Personalizada", desc: "Itinerarios que se adaptan a ti en tiempo real" },
  { emoji: "🗺️", title: "Mapa Interactivo", desc: "Visualiza todo tu viaje con markers inteligentes" },
  { emoji: "📔", title: "Diario de Viaje", desc: "La IA captura tus experiencias automáticamente" },
  { emoji: "⭐", title: "Recomendaciones", desc: "Aprende de tus gustos para mejorar cada viaje" },
  { emoji: "🔄", title: "Adaptación Live", desc: "Cambia planes sobre la marcha sin perder el hilo" },
  { emoji: "💰", title: "Control de Gastos", desc: "Presupuesto inteligente por actividad y día" },
]

export default function ParallaxHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [motionOk, setMotionOk] = useState(true)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [gsapReady, setGsapReady] = useState(false)

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setMotionOk(!mq.matches)
    const handler = (e: MediaQueryListEvent) => setMotionOk(!e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const shouldAnimate = motionOk && motionEnabled

  useEffect(() => {
    if (!shouldAnimate || !containerRef.current) return

    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined

    // Dynamic import to avoid SSR issues
    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([gsapMod, stMod]) => {
      const gsap = gsapMod.gsap
      const ScrollTrigger = stMod.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)
      setGsapReady(true)

      ctx = gsap.context(() => {
        // --- PHASE 1: Hero entry → Phone rotates from 45° to 0° with text ---
        const tl1 = gsap.timeline({
          scrollTrigger: {
            trigger: ".parallax-section-1",
            start: "top top",
            end: "+=150%",
            scrub: 1.2,
            pin: true,
          },
        })

        tl1.from(".phone-1", {
          rotateY: 45,
          rotateX: 12,
          scale: 0.85,
          duration: 1,
          ease: "power2.out",
        }, 0)
        .from(".hero-title", {
          y: 60,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.1)
        .from(".hero-subtitle", {
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.3)

        // --- PHASE 2: Second phone appears, rotating into view ---
        const tl2 = gsap.timeline({
          scrollTrigger: {
            trigger: ".parallax-section-2",
            start: "top top",
            end: "+=150%",
            scrub: 1.2,
            pin: true,
          },
        })

        tl2.from(".phone-2", {
          rotateY: 20,
          rotateX: 5,
          scale: 0.9,
          opacity: 0,
          duration: 1,
          ease: "power3.inOut",
        }, 0)
        .from(".mid-text", {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.3)

        // --- PHASE 3: Phone flat + Features pop out ---
        const tl3 = gsap.timeline({
          scrollTrigger: {
            trigger: ".parallax-section-3",
            start: "top top",
            end: "+=200%",
            scrub: 1.2,
            pin: true,
          },
        })

        tl3.from(".phone-3", {
          scale: 0.9,
          opacity: 0,
          y: 40,
          duration: 0.5,
          ease: "power2.out",
        }, 0)
        .from(".feature-card", {
          scale: 0.3,
          opacity: 0,
          y: 80,
          stagger: 0.06,
          duration: 0.5,
          ease: "back.out(1.4)",
        }, 0.2)
        .from(".feature-glow", {
          opacity: 0,
          duration: 0.5,
        }, 0.2)

        // --- Background parallax layer (slow) ---
        gsap.to(".bg-gradient-layer", {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        })
      }, containerRef)
    })

    return () => { ctx?.revert() }
  }, [shouldAnimate])

  return (
    <div ref={containerRef} className="parallax-container relative">
      {/* Motion toggle — WCAG SC 2.2.2 */}
      <button
        onClick={() => setMotionEnabled((v) => !v)}
        className="fixed top-4 right-4 z-50 bg-white/10 backdrop-blur-md text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
        aria-label={motionEnabled ? "Pausar animaciones" : "Activar animaciones"}
      >
        {motionEnabled ? "⏸ Pausar motion" : "▶ Activar motion"}
      </button>

      {/* Background parallax layer (10-30% speed) */}
      <div className="bg-gradient-layer fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#131325] to-[#0a0a1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
      </div>

      {/* ============ SECTION 1: Hero — Phone at angle + title ============ */}
      <section className="parallax-section-1 relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          {/* Text — always visible */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="hero-title text-5xl md:text-7xl font-bold text-white leading-tight">
              Tu viaje perfecto,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                planificado por IA
              </span>
            </h1>
            <p className="hero-subtitle mt-6 text-lg md:text-xl text-white/60 max-w-md">
              Viaje360 crea itinerarios personalizados que se adaptan en tiempo
              real a tus gustos, tu ritmo y tus descubrimientos.
            </p>
          </div>

          {/* Phone 1 */}
          <div
            className="phone-1 flex-1 flex justify-center"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            <div className="relative w-[280px] md:w-[320px] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/20 border-[3px] border-white/10">
              <Image
                src="/parallax/keyframe-1-hero.jpg"
                alt="Viaje360 — Plan de viaje Tokyo"
                width={320}
                height={693}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: Transition — mid-angle ============ */}
      <section className="parallax-section-2 relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
          <div
            className="phone-2"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            <div className="relative w-[300px] md:w-[340px] rounded-[3rem] overflow-hidden shadow-2xl shadow-cyan-500/20 border-[3px] border-white/10">
              <Image
                src="/parallax/keyframe-2-transition.jpg"
                alt="Viaje360 — Transición de features"
                width={340}
                height={736}
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="mid-text text-center max-w-lg">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Todo para viajar{" "}
              <span className="text-cyan-400">mejor</span>
            </h2>
            <p className="mt-4 text-white/50 text-lg">
              Un asistente que aprende contigo, viaje tras viaje.
            </p>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3: Flat + Features pop out ============ */}
      <section className="parallax-section-3 relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Glow effect behind features */}
        <div className="feature-glow absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-10">
          {/* Phone flat */}
          <div className="phone-3">
            <div className="relative w-[260px] md:w-[300px] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/30 border-[3px] border-white/10">
              <Image
                src="/parallax/keyframe-3-flat.jpg"
                alt="Viaje360 — Vista completa"
                width={300}
                height={650}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl">
            {features.map((f, i) => (
              <div
                key={i}
                className="feature-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 transition-colors"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-white font-semibold text-sm md:text-base">
                  {f.title}
                </h3>
                <p className="text-white/40 text-xs md:text-sm mt-1">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA Final ============ */}
      <section className="relative min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Empieza tu aventura
          </h2>
          <a
            href="/onboarding"
            className="inline-block bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-lg px-10 py-4 rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105"
          >
            Crear mi primer viaje →
          </a>
        </div>
      </section>
    </div>
  )
}
