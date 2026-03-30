"use client"

import { useRef, Suspense, lazy, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

const Spline = lazy(() => import("@splinetool/react-spline"))

const SPLINE_SCENE = "https://prod.spline.design/Hn4x9IDNy2OxVAiw/scene.splinecode"

interface HeroSectionProps {
  isAuthenticated?: boolean
}

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const videoY = useSpring(rawY, { stiffness: 100, damping: 30 })

  // Globe parallax — moves slower than scroll for depth
  const globeY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const globeOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.8, 0])

  const handleScrollDown = () => {
    const next = document.getElementById("como-funciona")
    next?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={ref}
      className="relative h-screen overflow-hidden"
    >
      {/* Parallax video background */}
      <motion.div
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{ y: videoY, willChange: "transform" }}
      >
        <div className="hidden sm:block w-full h-full">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/landing/hero-poster.jpg"
            className="w-full h-full object-cover"
          >
            <source src="/landing/hero-video.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="sm:hidden w-full h-full relative">
          <Image
            src="/landing/hero-poster.jpg"
            alt="Santorini"
            fill
            className="object-cover"
            priority
            quality={80}
          />
        </div>
      </motion.div>

      {/* Gradient overlay — darker to make globe pop */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85 z-10" />

      {/* Split layout: content left, globe right (desktop) / stacked (mobile) */}
      <div className="relative z-20 h-full flex flex-col lg:flex-row items-center justify-center px-6 max-w-7xl mx-auto gap-4 lg:gap-12">
        
        {/* Left side — text content */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6"
          >
            <Image
              src="/logo.svg"
              alt="Viaje360"
              width={80}
              height={80}
              className="w-16 h-16 lg:w-20 lg:h-20"
              priority
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5"
          >
            Tu viaje perfecto,{" "}
            <span className="bg-gradient-to-r from-[#0A84FF] to-[#5856D6] bg-clip-text text-transparent">
              diseñado por IA
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg text-gray-300 max-w-xl mb-8 leading-relaxed"
          >
            Itinerarios personalizados que se adaptan en tiempo real a ti, al clima y al momento
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            {isAuthenticated ? (
              <Link
                href="/home"
                prefetch
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-[#5856D6] text-white font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25"
              >
                Ir a mi viaje →
              </Link>
            ) : (
              <Link
                href="/login"
                prefetch
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-[#5856D6] text-white font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25"
              >
                Planifica gratis →
              </Link>
            )}
            <button
              onClick={handleScrollDown}
              className="px-7 py-3.5 rounded-2xl border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Ver cómo funciona ↓
            </button>
          </motion.div>
        </div>

        {/* Right side — 3D Globe (desktop) / smaller below text (mobile) */}
        <motion.div
          className="flex-shrink-0 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[480px] lg:h-[480px] xl:w-[540px] xl:h-[540px] relative"
          style={{ y: globeY, opacity: globeOpacity, willChange: "transform" }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
              </div>
            }
          >
            <Spline
              scene={SPLINE_SCENE}
              onLoad={() => setSplineLoaded(true)}
              style={{ width: "100%", height: "100%" }}
            />
          </Suspense>

          {/* Glow effect behind globe */}
          <div
            className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(10,132,255,0.4) 0%, rgba(88,86,214,0.2) 50%, transparent 70%)",
            }}
          />
        </motion.div>
      </div>

      {/* Bounce arrow */}
      <motion.button
        onClick={handleScrollDown}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/60 hover:text-white transition-colors"
        aria-label="Scroll down"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>
    </section>
  )
}
