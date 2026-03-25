"use client"

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Hero section — Apple M5-style sticky container.
 * The Three.js starfield is now a separate fixed-position component (StarfieldBg).
 * This component only handles the hero content + scroll animations.
 */
export const Component = () => {
  const containerRef     = useRef<HTMLDivElement>(null)
  const videoRef         = useRef<HTMLVideoElement>(null)
  const videoWrapRef     = useRef<HTMLDivElement>(null)
  const maskTextRef      = useRef<HTMLParagraphElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const eyebrowRef       = useRef<HTMLDivElement>(null)
  const headlineRef      = useRef<HTMLHeadingElement>(null)
  const copyRef          = useRef<HTMLParagraphElement>(null)
  const ctaRef           = useRef<HTMLDivElement>(null)

  // GSAP scroll-driven animations
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // 1. Mask text: huge → shrinks → gone (0→40%)
      if (maskTextRef.current) {
        gsap.fromTo(maskTextRef.current,
          { scale: 6, opacity: 0.9 },
          { scale: 1, opacity: 0, ease: 'power2.inOut',
            scrollTrigger: { trigger: containerRef.current, start: 'top top', end: '40% top', scrub: 1.2 } }
        )
      }

      // 2. Phone video: fades in 8→30%, fades out 72→90%
      if (videoWrapRef.current) {
        gsap.fromTo(videoWrapRef.current,
          { opacity: 0, scale: 0.88, y: 40 },
          { opacity: 1, scale: 1, y: 0, ease: 'power3.out',
            scrollTrigger: { trigger: containerRef.current, start: '8% top', end: '30% top', scrub: 1 } }
        )
        gsap.to(videoWrapRef.current, {
          opacity: 0, scale: 1.05,
          scrollTrigger: { trigger: containerRef.current, start: '72% top', end: '90% top', scrub: 1 } }
        )
      }

      // 3. Content: staggered fade-in 44→65%
      if (scrollContentRef.current) {
        gsap.fromTo(scrollContentRef.current,
          { opacity: 0 },
          { opacity: 1,
            scrollTrigger: { trigger: containerRef.current, start: '42% top', end: '55% top', scrub: 1 } }
        )
      }
      const els = [eyebrowRef.current, headlineRef.current, copyRef.current, ctaRef.current].filter(Boolean)
      els.forEach((el, i) => {
        gsap.fromTo(el!,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, ease: 'power3.out',
            scrollTrigger: { trigger: containerRef.current, start: `${44 + i * 5}% top`, end: `${58 + i * 5}% top`, scrub: 1 } }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '350vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20" style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0c)' }} />

        {/* Phone video — right side */}
        <div className="absolute inset-0 flex items-center justify-end pr-[6vw] z-10 pointer-events-none hidden md:flex">
          <div ref={videoWrapRef} style={{ width: 'clamp(240px, 24vw, 380px)', opacity: 0 }}>
            <video
              ref={videoRef}
              muted autoPlay loop playsInline preload="auto"
              className="w-full h-auto drop-shadow-2xl"
              style={{ mixBlendMode: 'lighten' }}
            >
              <source src="/hero-video1.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Mask text — giant, shrinks on scroll */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
          <p
            ref={maskTextRef}
            className="font-extrabold tracking-tight text-white select-none text-center leading-none"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', transformOrigin: 'center center', textShadow: '0 0 80px rgba(10,132,255,0.4)' }}
          >
            Tu viaje perfecto,<br />
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
              planificado por IA
            </span>
          </p>
        </div>

        {/* Scroll content — fades in mid-scroll */}
        <div
          ref={scrollContentRef}
          className="absolute inset-0 flex flex-col items-start justify-center pl-[8vw] pr-4 md:pr-[38vw] z-20 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div ref={eyebrowRef}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-6 w-fit"
            style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)', backdropFilter: 'blur(10px)', opacity: 0 }}
          >
            ✦ Impulsado por IA
          </div>

          <h1 ref={headlineRef}
            className="text-[clamp(1.8rem,4.5vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight max-w-xl"
            style={{ opacity: 0 }}
          >
            Tu viaje perfecto,{' '}
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
              planificado por IA
            </span>
          </h1>

          <p ref={copyRef}
            className="mt-5 text-[clamp(0.9rem,1.5vw,1.05rem)] text-[#c0c6d6] max-w-sm leading-relaxed"
            style={{ opacity: 0 }}
          >
            Itinerarios cinematográficos que se adaptan a ti en tiempo real. Destinos de verdad, experiencias únicas.
          </p>

          <div ref={ctaRef}
            className="mt-8 flex flex-col sm:flex-row gap-3 pointer-events-auto"
            style={{ opacity: 0 }}
          >
            <a href="/onboarding" className="px-7 py-3.5 rounded-full text-[14px] font-semibold text-white transition-all hover:scale-[1.03] w-fit"
              style={{ background: 'linear-gradient(135deg, #0A84FF, #5856D6)', boxShadow: '0 8px 32px rgba(10,132,255,0.3)' }}>
              Planifica gratis →
            </a>
            <a href="#features" className="px-7 py-3.5 rounded-full text-[14px] font-medium text-[#c0c6d6] transition-all hover:text-white w-fit"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              Descubre más
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-20">
          <span className="text-[10px] text-[#555] uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#555] to-transparent" />
        </div>

      </div>
    </div>
  )
}
