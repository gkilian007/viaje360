"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const Component = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const maskTextRef  = useRef<HTMLParagraphElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const eyebrowRef   = useRef<HTMLDivElement>(null)
  const headlineRef  = useRef<HTMLHeadingElement>(null)
  const copyRef      = useRef<HTMLParagraphElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)

  const threeRefs = useRef<{
    scene: THREE.Scene | null
    camera: THREE.PerspectiveCamera | null
    renderer: THREE.WebGLRenderer | null
    stars: THREE.Points[]
    nebula: THREE.Mesh | null
    animationId: number | null
  }>({ scene: null, camera: null, renderer: null, stars: [], nebula: null, animationId: null })

  // ── Three.js background ──────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return
    const { current: refs } = threeRefs

    refs.scene    = new THREE.Scene()
    refs.camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    refs.camera.position.set(0, 20, 100)

    refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true })
    refs.renderer.setSize(window.innerWidth, window.innerHeight)
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    refs.renderer.toneMapping       = THREE.ACESFilmicToneMapping
    refs.renderer.toneMappingExposure = 0.5

    // Stars (3 layers)
    for (let i = 0; i < 3; i++) {
      const count = 4000
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      const col = new Float32Array(count * 3)
      const sz  = new Float32Array(count)
      for (let j = 0; j < count; j++) {
        const r     = 200 + Math.random() * 800
        const theta = Math.random() * Math.PI * 2
        const phi   = Math.acos(Math.random() * 2 - 1)
        pos[j*3]   = r * Math.sin(phi) * Math.cos(theta)
        pos[j*3+1] = r * Math.sin(phi) * Math.sin(theta)
        pos[j*3+2] = r * Math.cos(phi)
        const c   = new THREE.Color()
        const rnd = Math.random()
        if (rnd < 0.7)      c.setHSL(0,    0,   0.8 + Math.random() * 0.2)
        else if (rnd < 0.9) c.setHSL(0.08, 0.5, 0.8)
        else                c.setHSL(0.6,  0.5, 0.8)
        col[j*3] = c.r; col[j*3+1] = c.g; col[j*3+2] = c.b
        sz[j] = Math.random() * 2 + 0.5
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
      geo.setAttribute('size',     new THREE.BufferAttribute(sz,  1))
      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, depth: { value: i } },
        vertexShader: `
          attribute float size; attribute vec3 color; varying vec3 vColor;
          uniform float time; uniform float depth;
          void main(){
            vColor=color; vec3 p=position;
            float a=time*0.05*(1.0-depth*0.3);
            mat2 rot=mat2(cos(a),-sin(a),sin(a),cos(a)); p.xy=rot*p.xy;
            vec4 mv=modelViewMatrix*vec4(p,1.0);
            gl_PointSize=size*(300.0/-mv.z); gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader: `
          varying vec3 vColor;
          void main(){
            float d=length(gl_PointCoord-vec2(0.5));
            if(d>0.5)discard;
            gl_FragColor=vec4(vColor,1.0-smoothstep(0.0,0.5,d));
          }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      refs.scene!.add(new THREE.Points(geo, mat))
      refs.stars.push(new THREE.Points(geo, mat))
    }

    // Nebula
    const nebMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, c1: { value: new THREE.Color(0x0033ff) }, c2: { value: new THREE.Color(0x6600cc) } },
      vertexShader: `varying vec2 vUv; uniform float time; void main(){ vUv=uv; vec3 p=position; p.z+=sin(p.x*0.01+time)*20.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform vec3 c1; uniform vec3 c2; uniform float time; varying vec2 vUv;
        void main(){ float m=sin(vUv.x*8.0+time)*cos(vUv.y*8.0+time); vec3 c=mix(c1,c2,m*0.5+0.5); float a=0.18*(1.0-length(vUv-0.5)*2.0); gl_FragColor=vec4(c,a); }`,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000, 60, 60), nebMat)
    nebula.position.z = -600
    refs.scene!.add(nebula); refs.nebula = nebula

    // Animate
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      refs.camera!.position.x = Math.sin(t * 0.08) * 4
      refs.camera!.position.y = 20 + Math.cos(t * 0.12) * 2
      refs.camera!.lookAt(0, 0, -50)
      refs.stars.forEach(s => { (s.material as THREE.ShaderMaterial).uniforms.time.value = t })
      if (refs.nebula) (refs.nebula.material as THREE.ShaderMaterial).uniforms.time.value = t * 0.3
      refs.renderer!.render(refs.scene!, refs.camera!)
      refs.animationId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      refs.camera!.aspect = window.innerWidth / window.innerHeight
      refs.camera!.updateProjectionMatrix()
      refs.renderer!.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      refs.renderer?.dispose()
    }
  }, [])

  // ── GSAP scroll-driven animations ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {

      // 1. Mask text: starts huge, shrinks to normal as user scrolls (0% → 40%)
      if (maskTextRef.current) {
        gsap.fromTo(maskTextRef.current,
          { scale: 6, opacity: 0.9 },
          {
            scale: 1,
            opacity: 0,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top',
              end: '40% top',
              scrub: 1.2,
            },
          }
        )
      }

      // 2. Phone video: fades in at 10%, stays until 75%
      if (videoRef.current) {
        gsap.fromTo(videoRef.current,
          { opacity: 0, scale: 0.88, y: 40 },
          {
            opacity: 1, scale: 1, y: 0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: '8% top',
              end: '30% top',
              scrub: 1,
            },
          }
        )
        // Fade out near end
        gsap.to(videoRef.current, {
          opacity: 0, scale: 1.05,
          scrollTrigger: {
            trigger: containerRef.current,
            start: '72% top',
            end: '90% top',
            scrub: 1,
          },
        })
      }

      // 3. Scroll content: eyebrow + headline + copy + CTA appear at 45%→70%
      const els = [eyebrowRef.current, headlineRef.current, copyRef.current, ctaRef.current].filter(Boolean)
      if (scrollContentRef.current) {
        gsap.fromTo(scrollContentRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            scrollTrigger: {
              trigger: containerRef.current,
              start: '42% top',
              end: '55% top',
              scrub: 1,
            },
          }
        )
      }
      els.forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: `${44 + i * 5}% top`,
              end:   `${58 + i * 5}% top`,
              scrub: 1,
            },
          }
        )
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    // sticky-container: tall scroll runway
    <div ref={containerRef} className="relative w-full" style={{ height: '350vh' }}>

      {/* sticky-content: stays fixed while parent scrolls */}
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Three.js background canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, rgba(0,0,0,0.5) 100%)' }} />

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20" style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0c)' }} />

        {/* ── video-container: phone centered / right ── */}
        <div className="absolute inset-0 flex items-center justify-end pr-[6vw] z-10 pointer-events-none hidden md:flex">
          <div style={{ width: 'clamp(240px, 24vw, 380px)', opacity: 0 }} ref={videoRef}>
            <video
              muted autoPlay loop playsInline preload="auto"
              className="w-full h-auto drop-shadow-2xl"
              style={{ mixBlendMode: 'lighten' }}
            >
              <source src="/hero-video1.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* ── mask-container: giant text that shrinks on scroll ── */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
          <p
            ref={maskTextRef}
            className="font-extrabold tracking-tight text-white select-none text-center leading-none"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              transformOrigin: 'center center',
              textShadow: '0 0 80px rgba(10,132,255,0.4)',
            }}
          >
            Tu viaje perfecto,<br />
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
              planificado por IA
            </span>
          </p>
        </div>

        {/* ── section-scroll: text content that fades in mid-scroll ── */}
        <div
          ref={scrollContentRef}
          className="absolute inset-0 flex flex-col items-start justify-center pl-[8vw] pr-4 md:pr-[38vw] z-20 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div
            ref={eyebrowRef}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-6 w-fit"
            style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)', backdropFilter: 'blur(10px)', opacity: 0 }}
          >
            ✦ Impulsado por IA
          </div>

          <h1
            ref={headlineRef}
            className="text-[clamp(1.8rem,4.5vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight max-w-xl"
            style={{ opacity: 0 }}
          >
            Tu viaje perfecto,{' '}
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
              planificado por IA
            </span>
          </h1>

          <p
            ref={copyRef}
            className="mt-5 text-[clamp(0.9rem,1.5vw,1.05rem)] text-[#c0c6d6] max-w-sm leading-relaxed"
            style={{ opacity: 0 }}
          >
            Itinerarios cinematográficos que se adaptan a ti en tiempo real. Destinos de verdad, experiencias únicas.
          </p>

          <div
            ref={ctaRef}
            className="mt-8 flex flex-col sm:flex-row gap-3 pointer-events-auto"
            style={{ opacity: 0 }}
          >
            <a
              href="/onboarding"
              className="px-7 py-3.5 rounded-full text-[14px] font-semibold text-white transition-all hover:scale-[1.03] w-fit"
              style={{ background: 'linear-gradient(135deg, #0A84FF, #5856D6)', boxShadow: '0 8px 32px rgba(10,132,255,0.3)' }}
            >
              Planifica gratis →
            </a>
            <a
              href="#features"
              className="px-7 py-3.5 rounded-full text-[14px] font-medium text-[#c0c6d6] transition-all hover:text-white w-fit"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
            >
              Descubre más
            </a>
          </div>
        </div>

        {/* Scroll indicator — visible only at start */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-20">
          <span className="text-[10px] text-[#555] uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#555] to-transparent" />
        </div>

      </div>{/* /sticky-content */}
    </div>   /* /sticky-container */
  )
}
