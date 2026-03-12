'use client'

/* eslint-disable react/no-unknown-property */

import { useRef, useMemo, useState, useEffect } from 'react'
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

/** Fan-triangulate a convex polygon face → BufferGeometry with flat shading */
function makeFaceGeo(face: number[], verts: THREE.Vector3[]): THREE.BufferGeometry {
  // Use face centroid as the flat normal (all triangles in this face share it)
  const centroid = new THREE.Vector3()
  for (const i of face) centroid.add(verts[i]!)
  centroid.normalize()
  const [nx, ny, nz] = [centroid.x, centroid.y, centroid.z]

  const positions: number[] = []
  const normals: number[] = []

  for (let t = 1; t < face.length - 1; t++) {
    for (const i of [0, t, t + 1]) {
      const v = verts[face[i]!]!
      positions.push(v.x, v.y, v.z)
      normals.push(nx, ny, nz)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

/* ─────────────────────────────────────────────────────────────
 *  Trophy
 * ───────────────────────────────────────────────────────────── */
function Trophy() {
  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        metalness: 0.95,
        roughness: 0.1,
        envMapIntensity: 2.5,
      }),
    [],
  )

  const studAngles: [number, number, number][] = useMemo(
    () =>
      [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => [
        Math.cos(a) * 0.72,
        1.1,
        Math.sin(a) * 0.72,
      ]) as [number, number, number][],
    [],
  )

  return (
    <Float speed={1.4} rotationIntensity={0} floatIntensity={0.3}>
      <group position={[0, 0.6, 0]}>

        {/* Cup body */}
        <mesh position={[0, 1.1, 0]} material={goldMat}>
          <cylinderGeometry args={[1.1, 0.6, 1.6, 48]} />
        </mesh>

        {/* Cup rim ring */}
        <mesh position={[0, 1.9, 0]} material={goldMat}>
          <torusGeometry args={[1.08, 0.09, 16, 64]} />
        </mesh>

        {/* Decorative studs */}
        {studAngles.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#fffde7" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}

        {/* Stem */}
        <mesh position={[0, 0.1, 0]} material={goldMat}>
          <cylinderGeometry args={[0.12, 0.12, 1.0, 16]} />
        </mesh>

        {/* Stem knot */}
        <mesh position={[0, -0.18, 0]} material={goldMat}>
          <sphereGeometry args={[0.21, 24, 24]} />
        </mesh>

        {/* Base step 1 */}
        <mesh position={[0, -0.55, 0]} material={goldMat}>
          <cylinderGeometry args={[0.55, 0.65, 0.2, 32]} />
        </mesh>

        {/* Base step 2 */}
        <mesh position={[0, -0.76, 0]} material={goldMat}>
          <cylinderGeometry args={[0.78, 0.82, 0.22, 32]} />
        </mesh>

        {/* Left handle */}
        <mesh position={[-1.05, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} material={goldMat}>
          <torusGeometry args={[0.55, 0.06, 16, 48, Math.PI]} />
        </mesh>

        {/* Right handle */}
        <mesh position={[1.05, 1.1, 0]} rotation={[0, 0, -Math.PI / 2]} material={goldMat}>
          <torusGeometry args={[0.55, 0.06, 16, 48, Math.PI]} />
        </mesh>

      </group>
    </Float>
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
      new THREE.MeshStandardMaterial({
        color: '#111111',
        roughness: 0.55,
        metalness: 0.05,
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

  // Edge line segments for all 90 edges (drawn once per face-pair, harmless duplicates)
  const edgeGeo = useMemo(() => {
    const pos: number[] = []
    for (const face of [...pentagons, ...hexagons]) {
      const len = face.length
      for (let i = 0; i < len; i++) {
        const a = verts[face[i]!]!
        const b = verts[face[(i + 1) % len]!]!
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
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
    <group ref={groupRef} position={[0, -4.0, 0]} scale={2.4}>
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

      {/* PBR environment for metallic reflections */}
      <Environment preset="studio" />

      <Trophy />
      <SoccerBall />
      <Particles />
    </Canvas>
  )
}
