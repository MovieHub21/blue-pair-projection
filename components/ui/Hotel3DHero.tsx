'use client'

import { useEffect, useRef, useState } from 'react'

type ThreeRuntime = any
type ThreeCanvasProps = { className?: string }
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.min.js'

function loadThree(): Promise<ThreeRuntime> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-blue-pair-three]')
    if (existing) {
      if ((window as any).THREE) return resolve((window as any).THREE)
      existing.addEventListener('load', () => resolve((window as any).THREE))
      existing.addEventListener('error', () => reject(new Error('Three.js failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src = THREE_CDN
    script.async = true
    script.dataset.bluePairThree = 'true'
    script.onload = () => (window as any).THREE ? resolve((window as any).THREE) : reject(new Error('Three.js unavailable'))
    script.onerror = () => reject(new Error('Three.js failed to load'))
    document.head.appendChild(script)
  })
}

function createScene(THREE: any, canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x061326)
  scene.fog = new THREE.Fog(0x061326, 28, 70)
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 150)
  camera.position.set(13, 9, 22)

  scene.add(new THREE.HemisphereLight(0xb9d9ee, 0x111827, 1.8))
  const key = new THREE.DirectionalLight(0xffe1a2, 4)
  key.position.set(-12, 22, 14)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  scene.add(key)
  const fill = new THREE.PointLight(0x78b8ff, 12, 35, 2)
  fill.position.set(10, 7, 12)
  scene.add(fill)

  const gold = new THREE.MeshStandardMaterial({ color: 0xd7b45f, metalness: 0.72, roughness: 0.25 })
  const stone = new THREE.MeshStandardMaterial({ color: 0xbcc4cb, metalness: 0.12, roughness: 0.62 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x536171, metalness: 0.18, roughness: 0.52 })
  const glass = new THREE.MeshStandardMaterial({ color: 0x3b667c, metalness: 0.3, roughness: 0.16, transparent: true, opacity: 0.88 })
  const windows = new THREE.MeshStandardMaterial({ color: 0xf4cf78, emissive: 0xc98c35, emissiveIntensity: 0.7, roughness: 0.3 })
  const water = new THREE.MeshPhysicalMaterial({ color: 0x257f99, metalness: 0.05, roughness: 0.08, transmission: 0.12, transparent: true, opacity: 0.9 })
  const hotel = new THREE.Group()
  scene.add(hotel)

  const box = (w: number, h: number, d: number, material: any, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    hotel.add(mesh)
    return mesh
  }

  // Main architectural mass, wings, glass lobby and roof crown.
  box(9.4, 15, 5.6, stone, 1.5, 7.5, 0)
  box(5.4, 8.8, 6.8, dark, -6.1, 4.4, 0.3)
  box(4.8, 6.8, 7.1, dark, 6.9, 3.4, 0.5)
  box(4.8, 11.8, 0.32, glass, 1.4, 6.5, 2.86)
  box(6.2, 1.2, 3.4, glass, 1.4, 1.8, 3.6)
  box(6.8, 0.28, 4.6, gold, 1.4, 3.0, 4.0)
  box(10.2, 0.55, 6.4, gold, 1.5, 15.25, 0)
  box(5.8, 0.35, 4.8, dark, 1.5, 15.7, 0)
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 2.2, 12), gold)
  spire.position.set(1.5, 16.8, 0)
  hotel.add(spire)

  for (let floor = 0; floor < 7; floor += 1) {
    for (let col = 0; col < 4; col += 1) box(1.05, 0.82, 0.12, windows, -1.5 + col * 2, 4 + floor * 1.55, 2.93)
  }
  for (let col = 0; col < 5; col += 1) box(0.12, 13.4, 0.18, gold, -2.9 + col * 2.2, 7.7, 3.05)
  for (const side of [-1, 1]) {
    const baseX = side < 0 ? -6.1 : 6.9
    const z = side < 0 ? 3.72 : 4.12
    for (let floor = 0; floor < 4; floor += 1) {
      for (let col = 0; col < 3; col += 1) box(0.85, 0.7, 0.1, windows, baseX - 1.3 + col * 1.3, 2 + floor * 1.45, z)
    }
  }

  // Pool and terrace.
  box(15, 0.28, 7.5, new THREE.MeshStandardMaterial({ color: 0x1b2b3b, roughness: 0.9 }), 0, 0.15, 5.8)
  box(9.5, 0.18, 3.7, water, 0.5, 0.35, 5.1)
  box(2.6, 0.25, 2.8, dark, 6.1, 0.35, 5.1)
  for (let i = -3; i <= 3; i += 2) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), gold)
    lamp.position.set(i, 0.58, 3.1)
    hotel.add(lamp)
  }

  const palm = new THREE.MeshStandardMaterial({ color: 0x1b352d, roughness: 0.9 })
  for (const x of [-8.5, 9.3]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.2, 8), palm)
    trunk.position.set(x, 1.7, 5.2)
    hotel.add(trunk)
    for (let i = 0; i < 6; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 2.3, 5), palm)
      leaf.position.set(x, 3.35, 5.2)
      leaf.rotation.z = Math.PI / 2
      leaf.rotation.y = i * Math.PI / 3
      hotel.add(leaf)
    }
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0x07111d, roughness: 0.82, metalness: 0.08 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  ground.receiveShadow = true
  scene.add(ground)

  const resize = () => {
    const width = canvas.clientWidth || 700
    const height = canvas.clientHeight || 650
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  let raf = 0
  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0
  let disposed = false
  let lastInteraction = performance.now()
  const pointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.9
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.45
    lastInteraction = performance.now()
  }
  const pointerLeave = () => { targetX = 0; targetY = 0; lastInteraction = performance.now() }
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerleave', pointerLeave)

  const animate = () => {
    if (disposed) return
    raf = requestAnimationFrame(animate)
    const idle = performance.now() - lastInteraction > 2200
    if (idle) targetX += Math.sin(performance.now() * 0.00018) * 0.0006
    currentX += (targetX - currentX) * 0.045
    currentY += (targetY - currentY) * 0.045
    hotel.rotation.y = currentX * 0.32
    hotel.rotation.x = currentY * -0.08
    camera.position.x += ((13 + currentX * 4) - camera.position.x) * 0.025
    camera.position.y += ((9 - currentY * 2) - camera.position.y) * 0.025
    camera.lookAt(0, 6.4, 0)
    renderer.render(scene, camera)
  }
  animate()

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
    canvas.removeEventListener('pointermove', pointerMove)
    canvas.removeEventListener('pointerleave', pointerLeave)
    renderer.dispose()
  }
}

export default function Hotel3DHero({ className = '' }: ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading')

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false
    loadThree().then((THREE) => {
      if (cancelled || !canvasRef.current) return
      cleanup = createScene(THREE, canvasRef.current)
      setState('ready')
    }).catch(() => { if (!cancelled) setState('fallback') })
    return () => { cancelled = true; cleanup?.() }
  }, [])

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} aria-label="Interactive three-dimensional Blue Pair hotel visualization" className={`h-full w-full touch-none transition-opacity duration-700 ${state === 'fallback' ? 'opacity-0' : 'opacity-100'}`} />
      {state === 'loading' && <div className="absolute inset-0 grid place-items-center"><div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-white/45 backdrop-blur">Building the scene…</div></div>}
      {state === 'fallback' && <div className="absolute inset-0 grid place-items-center p-8 text-center"><div className="max-w-xs rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl"><div className="text-[10px] uppercase tracking-[0.22em] text-[#e2bd69]">Blue Pair</div><p className="mt-2 text-xs leading-relaxed text-white/50">The interactive architectural view is unavailable on this device.</p></div></div>}
      {state === 'ready' && <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[9px] uppercase tracking-[0.22em] text-white/40 backdrop-blur">Move around the building</div>}
    </div>
  )
}
