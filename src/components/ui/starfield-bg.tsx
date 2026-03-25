"use client"

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Fixed starfield background — stays behind all content, never scrolls away.
 * Render once, position: fixed, z-index: 0.
 */
export default function StarfieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.set(0, 20, 100)

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5

    const stars: THREE.Points[] = []

    // Stars — 3 layers
    for (let i = 0; i < 3; i++) {
      const count = 4000
      const geo   = new THREE.BufferGeometry()
      const pos   = new Float32Array(count * 3)
      const col   = new Float32Array(count * 3)
      const sz    = new Float32Array(count)

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
            vColor = color; vec3 p = position;
            float a = time * 0.05 * (1.0 - depth * 0.3);
            mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
            p.xy = rot * p.xy;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = size * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vColor;
          void main(){
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(vColor, 1.0 - smoothstep(0.0, 0.5, d));
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const pts = new THREE.Points(geo, mat)
      scene.add(pts)
      stars.push(pts)
    }

    // Nebula
    const nebMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, c1: { value: new THREE.Color(0x0033ff) }, c2: { value: new THREE.Color(0x6600cc) } },
      vertexShader: `
        varying vec2 vUv; uniform float time;
        void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x*0.01+time)*20.0; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `
        uniform vec3 c1; uniform vec3 c2; uniform float time; varying vec2 vUv;
        void main(){ float m = sin(vUv.x*8.0+time)*cos(vUv.y*8.0+time); vec3 c = mix(c1,c2,m*0.5+0.5); float a = 0.18*(1.0-length(vUv-0.5)*2.0); gl_FragColor = vec4(c,a); }`,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000, 60, 60), nebMat)
    nebula.position.z = -600
    scene.add(nebula)

    // Animate
    const clock = new THREE.Clock()
    let animId: number

    const animate = () => {
      const t = clock.getElapsedTime()
      camera.position.x = Math.sin(t * 0.08) * 4
      camera.position.y = 20 + Math.cos(t * 0.12) * 2
      camera.lookAt(0, 0, -50)
      stars.forEach(s => { (s.material as THREE.ShaderMaterial).uniforms.time.value = t })
      ;(nebula.material as THREE.ShaderMaterial).uniforms.time.value = t * 0.3
      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animId)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
