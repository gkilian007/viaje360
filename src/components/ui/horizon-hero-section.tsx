"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const Component = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const phoneVideoRef = useRef<HTMLVideoElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const [isReady, setIsReady] = useState(false)

  const threeRefs = useRef<{
    scene: THREE.Scene | null
    camera: THREE.PerspectiveCamera | null
    renderer: THREE.WebGLRenderer | null
    stars: THREE.Points[]
    nebula: THREE.Mesh | null
    mountains: THREE.Mesh[]
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    stars: [],
    nebula: null,
    mountains: [],
    animationId: null,
  })

  // ── Three.js scene setup ────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const { current: refs } = threeRefs

    refs.scene = new THREE.Scene()
    refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025)

    refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    refs.camera.position.set(0, 20, 100)

    refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true })
    refs.renderer.setSize(window.innerWidth, window.innerHeight)
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    refs.renderer.toneMapping = THREE.ACESFilmicToneMapping
    refs.renderer.toneMappingExposure = 0.5

    // ── Stars ──
    const starCount = 4000
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(starCount * 3)
      const colors = new Float32Array(starCount * 3)
      const sizes = new Float32Array(starCount)

      for (let j = 0; j < starCount; j++) {
        const radius = 200 + Math.random() * 800
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[j * 3 + 2] = radius * Math.cos(phi)

        const color = new THREE.Color()
        const r = Math.random()
        if (r < 0.7) color.setHSL(0, 0, 0.8 + Math.random() * 0.2)
        else if (r < 0.9) color.setHSL(0.08, 0.5, 0.8)
        else color.setHSL(0.6, 0.5, 0.8)
        colors[j * 3] = color.r
        colors[j * 3 + 1] = color.g
        colors[j * 3 + 2] = color.b
        sizes[j] = Math.random() * 2 + 0.5
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, depth: { value: i } },
        vertexShader: `
          attribute float size; attribute vec3 color; varying vec3 vColor;
          uniform float time; uniform float depth;
          void main() {
            vColor = color; vec3 pos = position;
            float angle = time * 0.05 * (1.0 - depth * 0.3);
            mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
            pos.xy = rot * pos.xy;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(vColor, 1.0 - smoothstep(0.0, 0.5, d));
          }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      })

      const stars = new THREE.Points(geometry, material)
      refs.scene!.add(stars)
      refs.stars.push(stars)
    }

    // ── Nebula ──
    const nebulaGeo = new THREE.PlaneGeometry(8000, 4000, 80, 80)
    const nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x0033ff) },
        color2: { value: new THREE.Color(0xff0066) },
        opacity: { value: 0.25 },
      },
      vertexShader: `
        varying vec2 vUv; varying float vElev; uniform float time;
        void main() {
          vUv = uv; vec3 p = position;
          float e = sin(p.x*0.01+time)*cos(p.y*0.01+time)*20.0;
          p.z += e; vElev = e;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform vec3 color1; uniform vec3 color2; uniform float opacity; uniform float time;
        varying vec2 vUv; varying float vElev;
        void main() {
          float m = sin(vUv.x*10.0+time)*cos(vUv.y*10.0+time);
          vec3 c = mix(color1,color2,m*0.5+0.5);
          float a = opacity*(1.0-length(vUv-0.5)*2.0)*(1.0+vElev*0.01);
          gl_FragColor = vec4(c,a);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat)
    nebula.position.z = -1050
    refs.scene!.add(nebula)
    refs.nebula = nebula

    // ── Mountains ──
    const layers = [
      { z: -80, opacity: 0.9, color: 0x0a0a1a, scale: 1.4 },
      { z: -50, opacity: 0.85, color: 0x0d0d22, scale: 1.2 },
      { z: -20, opacity: 0.95, color: 0x111130, scale: 1.0 },
    ]
    layers.forEach(({ z, opacity, color, scale }) => {
      const pts: THREE.Vector2[] = []
      const seg = 120, w = 600 * scale, base = -30
      pts.push(new THREE.Vector2(-w / 2, base))
      for (let k = 0; k <= seg; k++) {
        const x = -w / 2 + (w * k) / seg
        let y = base
        y += Math.sin(k * 0.08) * 25 * scale
        y += Math.sin(k * 0.15 + 1.3) * 18 * scale
        y += Math.sin(k * 0.32 + 0.7) * 10 * scale
        if (k % 12 === 0) y += Math.random() * 20 * scale
        pts.push(new THREE.Vector2(x, y))
      }
      pts.push(new THREE.Vector2(w / 2, base))
      pts.push(new THREE.Vector2(-w / 2, base))
      const shape = new THREE.Shape(pts)
      const geo = new THREE.ShapeGeometry(shape)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.FrontSide })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.z = z
      refs.scene!.add(mesh)
      refs.mountains.push(mesh)
    })

    // ── Atmosphere ──
    const atmGeo = new THREE.PlaneGeometry(800, 60)
    const atmMat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0x0a2fff) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 color; varying vec2 vUv; void main(){ float a=smoothstep(0.0,0.5,vUv.y)*(1.0-vUv.y)*0.6; gl_FragColor=vec4(color,a); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
    const atmosphere = new THREE.Mesh(atmGeo, atmMat)
    atmosphere.position.set(0, -20, -10)
    refs.scene!.add(atmosphere)

    // ── Animate ──
    const clock = new THREE.Clock()
    const camTarget = { x: 0, y: 20, z: 100 }

    const animate = () => {
      const t = clock.getElapsedTime()

      if (refs.camera) {
        refs.camera.position.x += (camTarget.x - refs.camera.position.x) * 0.04
        refs.camera.position.y += (camTarget.y - refs.camera.position.y) * 0.04
        refs.camera.position.z += (camTarget.z - refs.camera.position.z) * 0.04
        // Subtle float
        refs.camera.position.x += Math.sin(t * 0.1) * 0.3
        refs.camera.position.y += Math.cos(t * 0.15) * 0.2
        refs.camera.lookAt(0, 0, -50)
      }

      refs.stars.forEach((s) => {
        (s.material as THREE.ShaderMaterial).uniforms.time.value = t
      })
      if (refs.nebula) {
        (refs.nebula.material as THREE.ShaderMaterial).uniforms.time.value = t * 0.3
      }
      refs.mountains.forEach((m, i) => {
        m.position.x = Math.sin(t * 0.05 + i) * (2 + i * 1.5)
      })

      refs.renderer?.render(refs.scene!, refs.camera!)
      refs.animationId = requestAnimationFrame(animate)
    }

    // ── GSAP scroll: camera + phone + text ──
    const setupScroll = () => {
      if (!containerRef.current) return

      // Camera fly-through
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress
          camTarget.z = 100 - p * 500
          camTarget.y = 20 - p * 60
          camTarget.x = Math.sin(p * Math.PI) * 30
        },
      })

      // Phone mockup: scale up + pan video
      if (phoneRef.current && phoneVideoRef.current) {
        gsap.set(phoneRef.current, { scale: 0.6, y: 80, opacity: 0 })

        gsap.to(phoneRef.current, {
          scale: 1,
          y: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '30% top',
            scrub: 1,
          },
        })

        // Video vertical pan (top → bottom of phone content)
        gsap.to(phoneVideoRef.current, {
          y: '-40%',
          scrollTrigger: {
            trigger: containerRef.current,
            start: '10% top',
            end: '80% top',
            scrub: 1.2,
          },
        })

        // Phone fades out at end
        gsap.to(phoneRef.current, {
          scale: 1.1,
          opacity: 0,
          scrollTrigger: {
            trigger: containerRef.current,
            start: '75% top',
            end: 'bottom bottom',
            scrub: 1,
          },
        })
      }

      // Text parallax
      if (titleRef.current) {
        gsap.to(titleRef.current, {
          y: -120,
          opacity: 0,
          scrollTrigger: {
            trigger: containerRef.current,
            start: '15% top',
            end: '45% top',
            scrub: 1,
          },
        })
      }
      if (subtitleRef.current) {
        gsap.to(subtitleRef.current, {
          y: -80,
          opacity: 0,
          scrollTrigger: {
            trigger: containerRef.current,
            start: '15% top',
            end: '40% top',
            scrub: 1,
          },
        })
      }
      if (ctaRef.current) {
        gsap.to(ctaRef.current, {
          y: -60,
          opacity: 0,
          scrollTrigger: {
            trigger: containerRef.current,
            start: '10% top',
            end: '35% top',
            scrub: 1,
          },
        })
      }
    }

    // ── Resize ──
    const onResize = () => {
      if (!refs.camera || !refs.renderer) return
      refs.camera.aspect = window.innerWidth / window.innerHeight
      refs.camera.updateProjectionMatrix()
      refs.renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    animate()
    setupScroll()
    setIsReady(true)

    return () => {
      window.removeEventListener('resize', onResize)
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      refs.renderer?.dispose()
    }
  }, [])

  // Title fade-in on load
  useEffect(() => {
    if (!isReady) return
    const tl = gsap.timeline()
    if (titleRef.current) tl.fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' })
    if (subtitleRef.current) tl.fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 0.15, ease: 'power3.out' }, '<')
    if (ctaRef.current) tl.fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    if (phoneRef.current) tl.fromTo(phoneRef.current, { opacity: 0 }, { opacity: 1, duration: 1 }, '-=0.6')
    return () => { tl.kill() }
  }, [isReady])

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '400vh' }}>
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Three.js canvas (background) */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Subtle dark vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Phone mockup with video — centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            ref={phoneRef}
            className="relative w-[300px] sm:w-[340px] md:w-[380px] opacity-0"
            style={{
              aspectRatio: '9/19.5',
              borderRadius: '3rem',
              overflow: 'hidden',
              border: '4px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 100px rgba(10,132,255,0.2), 0 0 60px rgba(0,0,0,0.5)',
              background: '#000',
            }}
          >
            {/* Video inside phone — taller than frame, pans with scroll */}
            <video
              ref={phoneVideoRef}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              className="absolute top-0 left-0 w-full"
              style={{ height: '160%' }}
            >
              <source src="/hero-video1.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Hero text — on top */}
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-[12vh] sm:pt-[14vh] px-6 text-center z-20 pointer-events-none">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-5"
            style={{
              background: 'rgba(10,132,255,0.1)',
              border: '1px solid rgba(10,132,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Impulsado por IA
          </div>

          <h1
            ref={titleRef}
            className="text-[clamp(2rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight max-w-3xl opacity-0"
          >
            Tu viaje perfecto,{' '}
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
              planificado por IA
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="mt-4 text-[clamp(0.9rem,1.8vw,1.15rem)] text-[#c0c6d6] max-w-md leading-relaxed opacity-0"
          >
            Itinerarios cinematográficos que se adaptan a ti en tiempo real.
          </p>

          <div ref={ctaRef} className="mt-8 flex flex-col sm:flex-row gap-4 pointer-events-auto opacity-0">
            <a
              href="/onboarding"
              className="px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #0A84FF, #5856D6)', boxShadow: '0 8px 32px rgba(10,132,255,0.3)' }}
            >
              Planifica gratis
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-full text-[15px] font-medium text-[#c0c6d6] transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
            >
              Descubre más ↓
            </a>
          </div>
        </div>

        {/* Bottom gradient for transition to next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0c)' }}
        />

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-20">
          <span className="text-[11px] text-[#666] uppercase tracking-widest">Scroll</span>
          <span className="material-symbols-outlined text-[#666]">expand_more</span>
        </div>
      </div>
    </div>
  )
}
