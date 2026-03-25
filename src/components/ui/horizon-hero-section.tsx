"use client"

import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const Component = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const badgeRef     = useRef<HTMLDivElement>(null)
  const titleRef     = useRef<HTMLHeadingElement>(null)
  const subtitleRef  = useRef<HTMLParagraphElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)
  const scrollRef    = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  // Fallback: if GSAP hasn't animated after 2.5s, force-show everything
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!animated) {
        ;[badgeRef, titleRef, subtitleRef, ctaRef, videoWrapRef, scrollRef].forEach(r => {
          if (r.current) {
            r.current.style.opacity = '1'
            r.current.style.transform = 'none'
            r.current.style.filter = 'none'
          }
        })
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [animated])

  // Entrance animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      ;[badgeRef, titleRef, subtitleRef, ctaRef, videoWrapRef, scrollRef].forEach(r => {
        if (r.current) {
          r.current.style.opacity = '1'
          r.current.style.transform = 'none'
          r.current.style.filter = 'none'
        }
      })
      setAnimated(true)
      return
    }

    const springEase = 'elastic.out(1, 0.75)'
    const smoothEase = 'power4.out'
    const tl = gsap.timeline({
      delay: 0.4,
      onComplete: () => setAnimated(true),
    })

    if (badgeRef.current)
      tl.fromTo(badgeRef.current,
        { opacity: 0, y: 24, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: springEase })

    if (titleRef.current)
      tl.fromTo(titleRef.current,
        { opacity: 0, y: 50, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: smoothEase }, '-=0.6')

    if (subtitleRef.current)
      tl.fromTo(subtitleRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: smoothEase }, '-=0.7')

    if (ctaRef.current)
      tl.fromTo(ctaRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: springEase }, '-=0.5')

    if (videoWrapRef.current)
      tl.fromTo(videoWrapRef.current,
        { opacity: 0, scale: 0.8, x: 60 },
        { opacity: 1, scale: 1, x: 0, duration: 1.4, ease: springEase }, '-=1.0')

    if (scrollRef.current)
      tl.fromTo(scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')

    return () => { tl.kill() }
  }, [])

  // Scroll parallax (desktop only)
  useEffect(() => {
    if (!containerRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768
    if (prefersReducedMotion || isMobile) return

    const ctx = gsap.context(() => {
      const textEls = [badgeRef.current, titleRef.current, subtitleRef.current, ctaRef.current].filter(Boolean)
      textEls.forEach((el, i) => {
        gsap.to(el!, {
          y: -(60 + i * 15), ease: 'none',
          scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
        })
      })

      if (videoWrapRef.current) {
        gsap.to(videoWrapRef.current, {
          y: -30, ease: 'none',
          scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
        })
      }

      if (scrollRef.current) {
        gsap.to(scrollRef.current, {
          opacity: 0, y: -10,
          scrollTrigger: { trigger: containerRef.current, start: '5% top', end: '15% top', scrub: true },
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-screen z-[1]" role="banner">

      {/* Phone video — desktop: right side, mobile: centered below text */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[6vw] pointer-events-none">
        <div ref={videoWrapRef}
          className="w-[200px] md:w-[clamp(240px,24vw,380px)] mt-[55vh] md:mt-0"
          style={{ opacity: 0, willChange: 'transform, opacity' }}
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
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:pl-[8vw] md:pr-[38vw] pointer-events-none">
        <div ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-4 md:mb-6 w-fit pointer-events-auto"
          style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)', backdropFilter: 'blur(10px)', opacity: 0, willChange: 'transform, opacity' }}
        >
          ✦ Impulsado por IA
        </div>

        <h1 ref={titleRef}
          className="text-[clamp(1.8rem,5vw,4rem)] font-extrabold leading-[1.08] tracking-tight max-w-xl"
          style={{ opacity: 0, willChange: 'transform, opacity, filter' }}
        >
          Tu viaje perfecto,{' '}
          <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
            planificado por IA
          </span>
        </h1>

        <p ref={subtitleRef}
          className="mt-3 md:mt-5 text-[clamp(0.85rem,1.6vw,1.1rem)] text-[#c0c6d6] max-w-sm leading-relaxed"
          style={{ opacity: 0, willChange: 'transform, opacity' }}
        >
          Itinerarios cinematográficos que se adaptan a ti en tiempo real.
        </p>

        <div ref={ctaRef}
          className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 pointer-events-auto"
          style={{ opacity: 0, willChange: 'transform, opacity' }}
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
      <div ref={scrollRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none" aria-hidden="true" style={{ opacity: 0 }}>
        <span className="text-[10px] text-[#555] uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-[#555] to-transparent animate-bounce" />
      </div>
    </div>
  )
}
