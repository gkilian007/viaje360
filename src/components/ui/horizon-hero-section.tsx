"use client"

import React, { useEffect, useRef } from 'react'

export const Component = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const badgeRef     = useRef<HTMLDivElement>(null)
  const titleRef     = useRef<HTMLHeadingElement>(null)
  const subtitleRef  = useRef<HTMLParagraphElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamic import — if this fails, everything stays visible (default state)
    let killed = false

    ;(async () => {
      try {
        const { gsap } = await import('gsap')
        const { ScrollTrigger } = await import('gsap/ScrollTrigger')
        gsap.registerPlugin(ScrollTrigger)

        if (killed) return

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion) return

        const isMobile = window.innerWidth < 768
        const refs = [badgeRef.current, titleRef.current, subtitleRef.current, ctaRef.current, videoWrapRef.current].filter(Boolean)

        // Hide first, then animate in
        refs.forEach(el => gsap.set(el!, { opacity: 0, y: 30 }))
        if (videoWrapRef.current && !isMobile) gsap.set(videoWrapRef.current, { opacity: 0, scale: 0.85, x: 50, y: 0 })

        const tl = gsap.timeline({ delay: 0.3 })

        if (badgeRef.current)
          tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.75)' })
        if (titleRef.current)
          tl.to(titleRef.current, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.5')
        if (subtitleRef.current)
          tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power4.out' }, '-=0.6')
        if (ctaRef.current)
          tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.75)' }, '-=0.4')
        if (videoWrapRef.current) {
          if (isMobile) {
            tl.to(videoWrapRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
          } else {
            tl.to(videoWrapRef.current, { opacity: 1, scale: 1, x: 0, duration: 1.2, ease: 'elastic.out(1, 0.75)' }, '-=0.8')
          }
        }

        // Desktop scroll parallax
        if (!isMobile) {
          const textEls = [badgeRef.current, titleRef.current, subtitleRef.current, ctaRef.current].filter(Boolean)
          textEls.forEach((el, i) => {
            gsap.to(el!, {
              y: -(50 + i * 12), ease: 'none',
              scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
            })
          })
          if (videoWrapRef.current) {
            gsap.to(videoWrapRef.current, {
              y: -25, ease: 'none',
              scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
            })
          }
        }
      } catch (e) {
        // GSAP failed — elements are already visible, nothing to do
        console.warn('Hero animation skipped:', e)
      }
    })()

    return () => { killed = true }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full min-h-screen z-[1]" role="banner">

      {/* Phone video */}
      <div className="flex items-center justify-center md:absolute md:inset-0 md:justify-end md:pr-[6vw] pointer-events-none pt-[70vh] md:pt-0">
        <div ref={videoWrapRef}
          className="w-[180px] md:w-[clamp(240px,24vw,380px)]"
        >
          <video
            muted autoPlay loop playsInline preload="auto"
            aria-hidden="true"
            className="w-full h-auto"
            style={{ mixBlendMode: 'lighten', filter: 'drop-shadow(0 20px 60px rgba(10,132,255,0.15))' }}
          >
            <source src="/hero-video1.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Hero text */}
      <div className="absolute top-0 left-0 right-0 flex flex-col justify-center min-h-screen px-6 md:pl-[8vw] md:pr-[38vw] pointer-events-none">
        <div ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-4 md:mb-6 w-fit pointer-events-auto"
          style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)', backdropFilter: 'blur(10px)' }}
        >
          ✦ Impulsado por IA
        </div>

        <h1 ref={titleRef}
          className="text-[clamp(1.8rem,5vw,4rem)] font-extrabold leading-[1.08] tracking-tight max-w-xl"
        >
          Tu viaje perfecto,{' '}
          <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
            planificado por IA
          </span>
        </h1>

        <p ref={subtitleRef}
          className="mt-3 md:mt-5 text-[clamp(0.85rem,1.6vw,1.1rem)] text-[#c0c6d6] max-w-sm leading-relaxed"
        >
          Itinerarios cinematográficos que se adaptan a ti en tiempo real.
        </p>

        <div ref={ctaRef}
          className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 pointer-events-auto"
        >
          <a href="/onboarding"
            className="px-7 py-3.5 rounded-full text-[14px] font-semibold text-white text-center transition-all hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] w-fit"
            style={{ background: 'linear-gradient(135deg, #0A84FF, #5856D6)', boxShadow: '0 8px 32px rgba(10,132,255,0.3)' }}>
            Planifica gratis →
          </a>
          <a href="#features"
            className="px-7 py-3.5 rounded-full text-[14px] font-medium text-[#c0c6d6] text-center transition-all hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5856D6] w-fit"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            Descubre más
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-bounce" aria-hidden="true">
        <span className="text-[10px] text-[#555] uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-[#555] to-transparent" />
      </div>
    </div>
  )
}
