// La placa madre por dentro: tres piezas, una por etapa del RAG, unidas por pistas.
// Un pulso de luz viaja por la pista hacia la pieza que está trabajando.
import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Etapa } from '@/lib/conversacion'

type Pieza = 'gpu' | 'cpu' | 'ssd'
const PIEZAS: Record<Pieza, { pos: [number, number]; titulo: string; detalle: string; color: string }> = {
  gpu: { pos: [0, 0.3], titulo: 'GPU', detalle: 'Gemini', color: '#beee11' },
  cpu: { pos: [0, 0], titulo: 'CPU', detalle: 'Ollama · bge-m3', color: '#66c0f4' },
  ssd: { pos: [0, -0.3], titulo: 'SSD', detalle: 'pgvector', color: '#c084fc' },
}
const ENTRADA: [number, number] = [-0.85, 0.3]

// Qué recorrido hace el pulso en cada etapa.
const RECORRIDOS: Record<Etapa, [number, number][]> = {
  reescribir: [ENTRADA, [-0.3, 0.3], PIEZAS.gpu.pos],
  busqueda: [PIEZAS.gpu.pos, [0.25, 0.3], [0.25, 0], PIEZAS.cpu.pos, [-0.25, 0], [-0.25, -0.3], PIEZAS.ssd.pos],
  respuesta: [PIEZAS.ssd.pos, [0.4, -0.3], [0.4, 0.3], PIEZAS.gpu.pos, [-0.3, 0.3], ENTRADA],
}
const PIEZA_DE: Record<Etapa, Pieza[]> = { reescribir: ['gpu'], busqueda: ['cpu', 'ssd'], respuesta: ['gpu'] }

function texturaEtiqueta(titulo: string, detalle: string, color: string) {
  const lienzo = Object.assign(document.createElement('canvas'), { width: 512, height: 256 })
  const g = lienzo.getContext('2d')!
  g.fillStyle = '#0b0f14'; g.fillRect(0, 0, 512, 256)
  g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(8, 8, 496, 240)
  g.fillStyle = color; g.font = '700 96px "Chakra Petch", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(titulo, 256, 100)
  g.fillStyle = '#c7d5e0'; g.font = '600 40px Inter, sans-serif'; g.fillText(detalle, 256, 190)
  const t = new THREE.CanvasTexture(lienzo)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Pistas rectas entre puntos (cajitas finitas), para todas las conexiones.
function Pistas({ opacidad }: { opacidad: RefObject<number> }) {
  // un solo material para todas las pistas: se apagan y prenden juntas
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: '#beee11', transparent: true, opacity: 0, toneMapped: false }), [])
  const segmentos = useMemo(() => {
    const lista: { centro: [number, number]; largo: number; vertical: boolean }[] = []
    Object.values(RECORRIDOS).forEach(r => r.slice(1).forEach((b, i) => {
      const a = r[i]
      lista.push({ centro: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], largo: Math.hypot(b[0] - a[0], b[1] - a[1]), vertical: a[0] === b[0] })
    }))
    // pistas decorativas
    for (let i = 0; i < 9; i++) lista.push({ centro: [0.6 + (i % 3) * 0.12, -0.42 + i * 0.1], largo: 0.3, vertical: false })
    for (let i = 0; i < 7; i++) lista.push({ centro: [-0.65 + (i % 2) * 0.1, -0.4 + i * 0.09], largo: 0.25, vertical: false })
    return lista
  }, [])
  useFrame(() => { material.opacity = 0.35 * (opacidad.current ?? 0) })
  return (
    <group>
      {segmentos.map((s, i) => (
        <mesh key={i} material={material} position={[s.centro[0], s.centro[1], 0.002]} rotation={[0, 0, s.vertical ? Math.PI / 2 : 0]}>
          <planeGeometry args={[s.largo + 0.012, 0.012]} />
        </mesh>
      ))}
    </group>
  )
}

function Chip({ id, activa, opacidad }: { id: Pieza; activa: boolean; opacidad: RefObject<number> }) {
  const p = PIEZAS[id]
  const textura = useMemo(() => texturaEtiqueta(p.titulo, p.detalle, p.color), [p])
  const tapa = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const base = useMemo(() => new THREE.Color(p.color), [p.color])
  useFrame(({ clock }) => {
    const o = opacidad.current ?? 0
    if (tapa.current) tapa.current.opacity = o
    if (halo.current) {
      const latido = activa ? 1.4 + Math.sin(clock.elapsedTime * 8) * 0.7 : 0.18
      halo.current.color.copy(base).multiplyScalar(latido)
      halo.current.opacity = o
    }
  })
  return (
    <group position={[p.pos[0], p.pos[1], 0.01]}>
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[0.46, 0.25]} />
        <meshBasicMaterial ref={halo} transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.42, 0.21]} />
        <meshBasicMaterial ref={tapa} map={textura} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Pulso({ etapa }: { etapa: Etapa | null }) {
  const bola = useRef<THREE.Mesh>(null)
  const recorrido = useMemo(() => {
    if (!etapa) return null
    const camino = new THREE.CurvePath<THREE.Vector3>()
    const pts = RECORRIDOS[etapa]
    pts.slice(1).forEach((b, i) => camino.add(new THREE.LineCurve3(
      new THREE.Vector3(pts[i][0], pts[i][1], 0.02), new THREE.Vector3(b[0], b[1], 0.02))))
    return camino
  }, [etapa])
  const blanco = useMemo(() => new THREE.Color('#ffffff').multiplyScalar(4), [])
  useFrame(({ clock }) => {
    if (!bola.current) return
    bola.current.visible = !!recorrido
    if (recorrido) bola.current.position.copy(recorrido.getPointAt((clock.elapsedTime * 0.7) % 1))
  })
  return (
    <mesh ref={bola}>
      <sphereGeometry args={[0.022, 16, 16]} />
      <meshBasicMaterial color={blanco} toneMapped={false} />
    </mesh>
  )
}

// opacidad: 0 → invisible, 1 → del todo (lo maneja la línea de tiempo de la entrada).
export function Circuito({ etapa, opacidad }: { etapa: Etapa | null; opacidad: RefObject<number> }) {
  const placa = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => { if (placa.current) placa.current.opacity = opacidad.current ?? 0 })
  const activas = etapa ? PIEZA_DE[etapa] : []
  return (
    <group>
      <mesh>
        <planeGeometry args={[2.2, 1.24]} />
        <meshBasicMaterial ref={placa} color="#03100a" transparent opacity={0} />
      </mesh>
      <Pistas opacidad={opacidad} />
      {(Object.keys(PIEZAS) as Pieza[]).map(id => <Chip key={id} id={id} activa={activas.includes(id)} opacidad={opacidad} />)}
      <Pulso etapa={etapa} />
    </group>
  )
}
