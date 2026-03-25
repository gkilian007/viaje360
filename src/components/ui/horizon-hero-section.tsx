"use client"

import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export const Component = () => {
  const phoneRef = useRef<HTMLDivElement>(null)
  const phoneVideoRef = useRef<HTMLVideoElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (phoneVideoRef.current) phoneVideoRef.current.play().catch(() => {})
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    const tl = gsap.timeline()
    if (phoneRef.current) gsap.set(phoneRef.current, { scale: 0.85, opacity: 0, y: 30 })
    if (titleRef.current) tl.fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' })
    if (subtitleRef.current) tl.fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7')
    if (ctaRef.current) tl.fromTo(ctaRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    if (phoneRef.current) tl.to(phoneRef.current, { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, '-=0.4')
    return () => { tl.kill() }
  }, [isReady])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0c]">
      {/* Subtle gradient glow behind phone */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 60% at 70% 50%, rgba(10,132,255,0.06) 0%, transparent 70%)' }} />

      {/* Bottom fade to match next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0c)' }} />

      {/* Phone video — right side, no frame (video already contains phone bezel) */}
      <div className="absolute inset-0 flex items-center justify-end pr-[4vw] pointer-events-none z-10 hidden md:flex">
        <div ref={phoneRef} className="relative opacity-0" style={{ width: 'clamp(260px, 28vw, 420px)' }}>
          <video
            ref={phoneVideoRef}
            muted autoPlay loop playsInline preload="auto"
            className="w-full h-auto"
            style={{ mixBlendMode: 'lighten' }}
          >
            <source src="/hero-video1.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Hero text — left side */}
      <div className="absolute inset-0 flex flex-col justify-center pl-[8vw] pr-4 md:pr-[35vw] z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-6 w-fit" style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)', backdropFilter: 'blur(10px)' }}>
          ✦ Impulsado por IA
        </div>

        <h1 ref={titleRef} className="text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-tight max-w-xl opacity-0">
          Tu viaje perfecto,{' '}
          <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
            planificado por IA
          </span>
        </h1>

        <p ref={subtitleRef} className="mt-5 text-[clamp(0.9rem,1.6vw,1.1rem)] text-[#c0c6d6] max-w-sm leading-relaxed opacity-0">
          Itinerarios cinematográficos que se adaptan a ti en tiempo real.
        </p>

        <div ref={ctaRef} className="mt-8 flex flex-col sm:flex-row gap-3 pointer-events-auto opacity-0">
          <a href="/onboarding" className="px-7 py-3.5 rounded-full text-[14px] font-semibold text-white transition-all hover:scale-[1.03] w-fit" style={{ background: 'linear-gradient(135deg, #0A84FF, #5856D6)', boxShadow: '0 8px 32px rgba(10,132,255,0.3)' }}>
            Planifica gratis →
          </a>
          <a href="#features" className="px-7 py-3.5 rounded-full text-[14px] font-medium text-[#c0c6d6] transition-all hover:text-white w-fit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            Descubre más
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-20">
        <span className="text-[10px] text-[#555] uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-[#555] to-transparent" />
      </div>

      <style>{`
        @keyframes videoPan {
          from { transform: translateY(0%); }
          to   { transform: translateY(-33%); }
        }
      `}</style>
    </div>
  )
}
