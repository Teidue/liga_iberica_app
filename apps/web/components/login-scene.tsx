'use client'

/* eslint-disable react/no-unknown-property */

import { useRef, useMemo, useState, useEffect, Suspense } from 'react'

import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

/* ─────────────────────────────────────────────────────────────
 *  Truncated Icosahedron builder
 *
 *  A real soccer ball is a truncated icosahedron:
 *   - 12 black pentagonal faces (one per icosahedron vertex)
 *   - 20 white hexagonal faces  (one per icosahedron face)
 *
 *  We derive the 60 vertices by truncating each of the 30
 *  icosahedron edges at 1/3 from each endpoint, then projecting
 *  onto the unit sphere.  All face ordering is CCW (outward).
 * ───────────────────────────────────────────────────────────── */

const PHI = (1 + Math.sqrt(5)) / 2

// 12 icosahedron vertices on the unit sphere
const ICO_V = (
  [
    [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
    [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
  ] as [number, number, number][]
).map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize())

/** 30 edges: pairs whose dot product ≈ 1/√5 */
function buildIcoEdges(): [number, number][] {
  const COS_ADJ = 1 / Math.sqrt(5)
  const edges: [number, number][] = []
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++)
      if (Math.abs(ICO_V[i]!.dot(ICO_V[j]!) - COS_ADJ) < 0.01)
        edges.push([i, j])
  return edges
}

/** 20 outward-oriented triangular faces */
function buildIcoFaces(edges: [number, number][]): [number, number, number][] {
  const adj: number[][] = Array.from({ length: 12 }, () => [])
  for (const [a, b] of edges) { adj[a]!.push(b); adj[b]!.push(a) }

  const faces: [number, number, number][] = []
  const seen = new Set<string>()

  for (let a = 0; a < 12; a++) {
    for (const b of adj[a]!) {
      for (const c of adj[a]!) {
        if (c <= b || !adj[b]!.includes(c)) continue
        const key = [a, b, c].sort((x, y) => x - y).join()
        if (seen.has(key)) continue
        seen.add(key)
        // Orient: (b−a)×(c−a) must point same way as centroid (outward)
        const centroid = ICO_V[a]!.clone().add(ICO_V[b]!).add(ICO_V[c]!)
        const normal = new THREE.Vector3().crossVectors(
          ICO_V[b]!.clone().sub(ICO_V[a]!),
          ICO_V[c]!.clone().sub(ICO_V[a]!),
        )
        faces.push(centroid.dot(normal) > 0 ? [a, b, c] : [a, c, b])
      }
    }
  }
  return faces
}

type BallData = {
  verts: THREE.Vector3[]
  pentagons: number[][]
  hexagons: number[][]
}

function buildBall(): BallData {
  const edges = buildIcoEdges()       // 30
  const icoFaces = buildIcoFaces(edges) // 20

  // 60 new vertices — two per edge, one near each endpoint
  const verts: THREE.Vector3[] = []
  const eNear = new Map<string, number>()   // key "a,b" → index near a on edge (a,b)

  for (const [a, b] of edges) {
    eNear.set(`${a},${b}`, verts.length)
    verts.push(ICO_V[a]!.clone().lerp(ICO_V[b]!, 1 / 3).normalize())
    eNear.set(`${b},${a}`, verts.length)
    verts.push(ICO_V[b]!.clone().lerp(ICO_V[a]!, 1 / 3).normalize())
  }

  // 12 pentagons — one per icosahedron vertex, vertices sorted CCW
  const pentagons: number[][] = []
  for (let vi = 0; vi < 12; vi++) {
    const ring: number[] = []
    for (const [a, b] of edges) {
      if (a === vi) ring.push(eNear.get(`${a},${b}`)!)
      else if (b === vi) ring.push(eNear.get(`${b},${a}`)!)
    }
    // Sort by angle in tangent plane at ICO_V[vi]
    const n = ICO_V[vi]!
    const tmp = Math.abs(n.x) < 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0)
    const t1 = new THREE.Vector3().crossVectors(n, tmp).normalize()
    const t2 = new THREE.Vector3().crossVectors(n, t1).normalize()
    ring.sort((ia, ib) =>
      Math.atan2(verts[ia]!.dot(t2), verts[ia]!.dot(t1)) -
      Math.atan2(verts[ib]!.dot(t2), verts[ib]!.dot(t1)),
    )
    pentagons.push(ring)
  }

  // 20 hexagons — one per icosahedron face, vertices in CCW order
  const hexagons: number[][] = []
  for (const [a, b, c] of icoFaces) {
    hexagons.push([
      eNear.get(`${a},${b}`)!,
      eNear.get(`${b},${a}`)!,
      eNear.get(`${b},${c}`)!,
      eNear.get(`${c},${b}`)!,
      eNear.get(`${c},${a}`)!,
      eNear.get(`${a},${c}`)!,
    ])
  }

  return { verts, pentagons, hexagons }
}

/**
 * Fan-triangulate a convex polygon face, subdivide and project every vertex
 * onto the unit sphere so the face follows the ball's curvature.
 */
function makeFaceGeo(face: number[], verts: THREE.Vector3[], subdivisions = 3): THREE.BufferGeometry {
  // Initial fan triangulation from the first vertex
  const tris: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  const v0 = verts[face[0]!]!
  for (let t = 1; t < face.length - 1; t++) {
    tris.push([v0.clone(), verts[face[t]!]!.clone(), verts[face[t + 1]!]!.clone()])
  }

  // Subdivide: each triangle → 4 sub-triangles, project midpoints onto sphere
  for (let s = 0; s < subdivisions; s++) {
    const next: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
    for (const [a, b, c] of tris) {
      const ab = a.clone().lerp(b, 0.5).normalize()
      const bc = b.clone().lerp(c, 0.5).normalize()
      const ca = c.clone().lerp(a, 0.5).normalize()
      next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca])
    }
    tris.length = 0
    tris.push(...next)
  }

  const positions: number[] = []
  const normals: number[] = []

  for (const [a, b, c] of tris) {
    for (const v of [a, b, c]) {
      positions.push(v.x, v.y, v.z)
      // On a unit sphere the outward normal equals the position vector
      normals.push(v.x, v.y, v.z)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

/* ─────────────────────────────────────────────────────────────
 *  Trophy — Premium gold, spring entry + hover glow via useFrame
 * ───────────────────────────────────────────────────────────── */
function Trophy() {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)

  // Spring physics state for entry scale animation
  const springScale    = useRef(0)
  const springVelocity = useRef(0)
  const TARGET_SCALE   = 0.45

  // Smooth emissive value (interpolated each frame)
  const emissiveRef = useRef(0.05)

  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        metalness: 1.0,
        roughness: 0.15,
        emissive: new THREE.Color('#7B5000'),
        emissiveIntensity: 0.05,
        envMapIntensity: 3.0,
      }),
    [],
  )

  useFrame((_, dt) => {
    if (!groupRef.current) return

    // ── Spring scale (stiffness 180, damping 18)
    const force = (TARGET_SCALE - springScale.current) * 180
    const damp  = springVelocity.current * 18
    springVelocity.current += (force - damp) * dt
    springScale.current    += springVelocity.current * dt
    groupRef.current.scale.setScalar(Math.max(0, springScale.current))

    // ── Continuous Y rotation — faster on hover
    groupRef.current.rotation.y += dt * (hovered ? 1.1 : 0.3)

    // ── Smooth emissive glow transition
    const targetEmissive = hovered ? 0.5 : 0.05
    emissiveRef.current += (targetEmissive - emissiveRef.current) * Math.min(dt * 4, 1)
    goldMat.emissiveIntensity = emissiveRef.current
  })

  return (
    <>
      <Float speed={1.3} rotationIntensity={0} floatIntensity={0.22}>
        <group
          ref={groupRef}
          position={[0, 1.2, 0]}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
        >
          {/* ── Cup body — tapered cylinder */}
          <mesh position={[0, 1.2, 0]} material={goldMat}>
            <cylinderGeometry args={[1.28, 0.66, 2.0, 64]} />
          </mesh>

          {/* ── Cup lip ring */}
          <mesh position={[0, 2.2, 0]} material={goldMat}>
            <torusGeometry args={[1.25, 0.13, 16, 64]} />
          </mesh>

          {/* ── Cup base ring */}
          <mesh position={[0, 0.22, 0]} material={goldMat}>
            <torusGeometry args={[0.65, 0.07, 16, 48]} />
          </mesh>

          {/* ── Left handle */}
          <mesh position={[-1.2, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} material={goldMat}>
            <torusGeometry args={[0.62, 0.07, 16, 48, Math.PI]} />
          </mesh>

          {/* ── Right handle */}
          <mesh position={[1.2, 1.1, 0]} rotation={[0, 0, -Math.PI / 2]} material={goldMat}>
            <torusGeometry args={[0.62, 0.07, 16, 48, Math.PI]} />
          </mesh>

          {/* ── Upper neck (tapered) */}
          <mesh position={[0, -0.08, 0]} material={goldMat}>
            <cylinderGeometry args={[0.14, 0.22, 0.6, 32]} />
          </mesh>

          {/* ── Upper knot */}
          <mesh position={[0, -0.46, 0]} material={goldMat}>
            <sphereGeometry args={[0.24, 32, 32]} />
          </mesh>

          {/* ── Lower stem */}
          <mesh position={[0, -0.86, 0]} material={goldMat}>
            <cylinderGeometry args={[0.13, 0.13, 0.6, 32]} />
          </mesh>

          {/* ── Lower knot */}
          <mesh position={[0, -1.22, 0]} material={goldMat}>
            <sphereGeometry args={[0.20, 32, 32]} />
          </mesh>

          {/* ── Base step 1 */}
          <mesh position={[0, -1.48, 0]} material={goldMat}>
            <cylinderGeometry args={[0.58, 0.68, 0.22, 32]} />
          </mesh>

          {/* ── Base step 2 */}
          <mesh position={[0, -1.72, 0]} material={goldMat}>
            <cylinderGeometry args={[0.80, 0.90, 0.22, 32]} />
          </mesh>

          {/* ── Base bottom */}
          <mesh position={[0, -1.94, 0]} material={goldMat}>
            <cylinderGeometry args={[0.98, 1.03, 0.18, 48]} />
          </mesh>

          {/* ── Star cap on top */}
          <mesh position={[0, 2.42, 0]} material={goldMat}>
            <sphereGeometry args={[0.17, 16, 16]} />
          </mesh>

        </group>
      </Float>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
 *  Soccer Ball — real truncated icosahedron, rotating
 * ───────────────────────────────────────────────────────────── */
function SoccerBall() {
  const groupRef = useRef<THREE.Group>(null)
  const { verts, pentagons, hexagons } = useMemo(() => buildBall(), [])

  // polygonOffset pushes faces slightly back so edge lines render on top cleanly
  const blackMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#111111',
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [],
  )
  const whiteMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#efefef',
        roughness: 0.4,
        metalness: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [],
  )
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#000000' }),
    [],
  )

  const pentGeos = useMemo(
    () => pentagons.map((f) => makeFaceGeo(f, verts)),
    [pentagons, verts],
  )
  const hexGeos = useMemo(
    () => hexagons.map((f) => makeFaceGeo(f, verts)),
    [hexagons, verts],
  )

  // Edge lines curved along the sphere surface (8 segments per edge)
  const edgeGeo = useMemo(() => {
    const pos: number[] = []
    const SEGS = 8
    for (const face of [...pentagons, ...hexagons]) {
      const len = face.length
      for (let i = 0; i < len; i++) {
        const a = verts[face[i]!]!
        const b = verts[face[(i + 1) % len]!]!
        for (let s = 0; s < SEGS; s++) {
          // Slightly above the sphere (1.002) so lines don't z-fight with faces
          const p1 = a.clone().lerp(b, s / SEGS).normalize().multiplyScalar(1.002)
          const p2 = a.clone().lerp(b, (s + 1) / SEGS).normalize().multiplyScalar(1.002)
          pos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
        }
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [pentagons, hexagons, verts])

  useFrame((_, dt) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += dt * 0.65
    groupRef.current.rotation.z += dt * 0.08
  })

  return (
    <group ref={groupRef} position={[0, -1.8, 0]} scale={1.6}>
      {pentGeos.map((g, i) => (
        <mesh key={`p${i}`} geometry={g} material={blackMat} />
      ))}
      {hexGeos.map((g, i) => (
        <mesh key={`h${i}`} geometry={g} material={whiteMat} />
      ))}
      <lineSegments geometry={edgeGeo} material={edgeMat} />
    </group>
  )
}

/* ─────────────────────────────────────────────────────────────
 *  Floating sparkle particles
 * ───────────────────────────────────────────────────────────── */
function Particles() {
  const ref = useRef<THREE.Points>(null)

  const geo = useMemo(() => {
    const count = 80
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.025
  })

  return (
    <points ref={ref}>
      <primitive object={geo} attach="geometry" />
      <pointsMaterial
        size={0.05}
        color="#6DAEDB"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

/* ─────────────────────────────────────────────────────────────
 *  Main export
 * ───────────────────────────────────────────────────────────── */
export function LoginScene() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <Canvas
      camera={{ position: [0, 0.5, 9], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      frameloop="always"
      resize={{ scroll: false, offsetSize: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 7, 5]}   intensity={2.0} color="#ffffff" />
      <pointLight position={[-4, 2, 3]}  intensity={0.9} color="#1D70A2" />
      <pointLight position={[2, -1, 4]}  intensity={0.5} color="#6DAEDB" />
      <pointLight position={[0, 3, -2]}  intensity={0.4} color="#D4AF37" />

      <Suspense fallback={null}>
        {/* City environment — best for metallic gold reflections */}
        <Environment preset="city" />

        <Trophy />
        <SoccerBall />
        <Particles />
      </Suspense>
    </Canvas>
  )
}
