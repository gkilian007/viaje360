"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const Component = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 })
  const cameraVelocity = useRef({ x: 0, y: 0, z: 0 })

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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const { current: refs } = threeRefs

    // ── Scene ──────────────────────────────────────────────
    refs.scene = new THREE.Scene()
    refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025)

    refs.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    )
    refs.camera.position.set(0, 20, 100)

    refs.renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })
    refs.renderer.setSize(window.innerWidth, window.innerHeight)
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    refs.renderer.toneMapping = THREE.ACESFilmicToneMapping
    refs.renderer.toneMappingExposure = 0.5

    // ── Stars ──────────────────────────────────────────────
    const createStarField = () => {
      const starCount = 5000
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
          const colorChoice = Math.random()
          if (colorChoice < 0.7) {
            color.setHSL(0, 0, 0.8 + Math.random() * 0.2)
          } else if (colorChoice < 0.9) {
            color.setHSL(0.08, 0.5, 0.8)
          } else {
            color.setHSL(0.6, 0.5, 0.8)
          }
          colors[j * 3] = color.r
          colors[j * 3 + 1] = color.g
          colors[j * 3 + 2] = color.b
          sizes[j] = Math.random() * 2 + 0.5
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const depth = i
        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            depth: { value: depth },
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float depth;
            void main() {
              vColor = color;
              vec3 pos = position;
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })

        const stars = new THREE.Points(geometry, material)
        refs.scene!.add(stars)
        refs.stars.push(stars)
      }
    }

    // ── Nebula ─────────────────────────────────────────────
    const createNebula = () => {
      const geometry = new THREE.PlaneGeometry(8000, 4000, 100, 100)
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0x0033ff) },
          color2: { value: new THREE.Color(0xff0066) },
          opacity: { value: 0.3 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          void main() {
            vUv = uv;
            vec3 pos = position;
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
            pos.z += elevation;
            vElevation = elevation;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vElevation;
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })

      const nebula = new THREE.Mesh(geometry, material)
      nebula.position.z = -1050
      nebula.rotation.x = 0
      refs.scene!.add(nebula)
      refs.nebula = nebula
    }

    // ── Mountains ──────────────────────────────────────────
    const createMountains = () => {
      const layers = [
        { z: -80, opacity: 0.9, color: 0x0a0a1a, scale: 1.4 },
        { z: -50, opacity: 0.85, color: 0x0d0d22, scale: 1.2 },
        { z: -20, opacity: 0.95, color: 0x111130, scale: 1.0 },
      ]

      layers.forEach(({ z, opacity, color, scale }) => {
        const points: THREE.Vector2[] = []
        const segments = 120
        const width = 600 * scale
        const baseY = -30

        points.push(new THREE.Vector2(-width / 2, baseY))

        for (let i = 0; i <= segments; i++) {
          const x = (-width / 2) + (width * i) / segments
          let y = baseY

          // Layered noise for natural mountain silhouette
          y += Math.sin(i * 0.08) * 25 * scale
          y += Math.sin(i * 0.15 + 1.3) * 18 * scale
          y += Math.sin(i * 0.32 + 0.7) * 10 * scale
          y += Math.sin(i * 0.71 + 2.1) * 5 * scale

          // Sharp peaks
          if (i % 12 === 0) y += Math.random() * 20 * scale

          points.push(new THREE.Vector2(x, y))
        }

        points.push(new THREE.Vector2(width / 2, baseY))
        points.push(new THREE.Vector2(-width / 2, baseY))

        const shape = new THREE.Shape(points)
        const geometry = new THREE.ShapeGeometry(shape)
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.FrontSide,
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.z = z
        refs.scene!.add(mesh)
        refs.mountains.push(mesh)
      })
    }

    // ── Atmosphere glow ────────────────────────────────────
    const createAtmosphere = () => {
      const geometry = new THREE.PlaneGeometry(800, 60, 1, 1)
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x0a2fff) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying vec2 vUv;
          void main() {
            float alpha = smoothstep(0.0, 0.5, vUv.y) * (1.0 - vUv.y) * 0.6;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })

      const atmosphere = new THREE.Mesh(geometry, material)
      atmosphere.position.set(0, -20, -10)
      refs.scene!.add(atmosphere)
    }

    // ── GSAP scroll camera ─────────────────────────────────
    const setupScroll = () => {
      if (!containerRef.current) return

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress
          // Fly forward through the star field
          smoothCameraPos.current.z = 100 - p * 400
          smoothCameraPos.current.y = 20 - p * 60
          smoothCameraPos.current.x = Math.sin(p * Math.PI) * 30
        },
      })
    }

    // ── Animate loop ───────────────────────────────────────
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsed = clock.getElapsedTime()

      // Smooth camera lerp
      if (refs.camera) {
        refs.camera.position.x += (smoothCameraPos.current.x - refs.camera.position.x) * 0.05
        refs.camera.position.y += (smoothCameraPos.current.y - refs.camera.position.y) * 0.05
        refs.camera.position.z += (smoothCameraPos.current.z - refs.camera.position.z) * 0.05
        refs.camera.lookAt(0, 0, -50)
      }

      // Update star uniforms
      refs.stars.forEach((star) => {
        const mat = star.material as THREE.ShaderMaterial
        mat.uniforms.time.value = elapsed
      })

      // Update nebula
      if (refs.nebula) {
        const mat = refs.nebula.material as THREE.ShaderMaterial
        mat.uniforms.time.value = elapsed * 0.3
      }

      // Gentle parallax on mountains
      refs.mountains.forEach((m, i) => {
        m.position.x = Math.sin(elapsed * 0.05 + i) * (2 + i * 1.5)
      })

      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }

      refs.animationId = requestAnimationFrame(animate)
    }

    // ── Resize ─────────────────────────────────────────────
    const onResize = () => {
      if (!refs.camera || !refs.renderer) return
      refs.camera.aspect = window.innerWidth / window.innerHeight
      refs.camera.updateProjectionMatrix()
      refs.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onResize)

    // ── Boot ───────────────────────────────────────────────
    createStarField()
    createNebula()
    createMountains()
    createAtmosphere()
    setupScroll()
    animate()
    setIsReady(true)

    return () => {
      window.removeEventListener('resize', onResize)
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      refs.renderer?.dispose()
    }
  }, [])

  // Animate title in when ready
  useEffect(() => {
    if (!isReady) return
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' })
    }
    if (subtitleRef.current) {
      gsap.fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' })
    }
  }, [isReady])

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '300vh' }}>
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Three.js canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Hero text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase text-[#0A84FF] mb-6"
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
            className="text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[1.05] tracking-tight max-w-4xl opacity-0"
          >
            Tu viaje perfecto,{' '}
            <span className="bg-gradient-to-r from-[#0A84FF] via-[#5856D6] to-[#BF5AF2] bg-clip-text text-transparent">
              planificado por IA
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="mt-6 text-[clamp(1rem,2vw,1.25rem)] text-[#c0c6d6] max-w-xl leading-relaxed opacity-0"
          >
            Itinerarios cinematográficos que se adaptan a ti en tiempo real.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 pointer-events-auto">
            <a
              href="/onboarding"
              className="px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-all hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, #0A84FF, #5856D6)',
                boxShadow: '0 8px 32px rgba(10,132,255,0.3)',
              }}
            >
              Planifica gratis
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-full text-[15px] font-medium text-[#c0c6d6] transition-all hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              Descubre más ↓
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none">
          <span className="text-[11px] text-[#666] uppercase tracking-widest">Scroll</span>
          <span className="material-symbols-outlined text-[#666]">expand_more</span>
        </div>
      </div>
    </div>
  )
}
