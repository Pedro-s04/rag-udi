// El escritorio gamer de Pixel en 3D (basado en la escena three.js de rag-diseño):
// monitor con la pantalla animada, gabinete con vidrio templado, teclado RGB, parlante y taza.
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ALTO, ANCHO, dibujarPantalla } from './pantalla'

// Material que brilla (lo levanta el bloom): color por encima de 1 y sin tone mapping.
function Brillo({ color, k = 2.5 }: { color: THREE.ColorRepresentation; k?: number }) {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(k), [color, k])
  return <meshBasicMaterial color={c} toneMapped={false} />
}

const Oscuro = () => <meshStandardMaterial color="#0a0b0e" roughness={0.38} metalness={0.55} />
const Metal = () => <meshStandardMaterial color="#2a2e35" roughness={0.28} metalness={0.85} />

function Monitor({ desarme }: { desarme: RefObject<number> }) {
  const textura = useMemo(() => {
    const lienzo = Object.assign(document.createElement('canvas'), { width: ANCHO, height: ALTO })
    const t = new THREE.CanvasTexture(lienzo)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [])
  useEffect(() => () => textura.dispose(), [textura])
  useFrame(({ clock }) => {
    const lienzo = textura.image as HTMLCanvasElement
    dibujarPantalla(lienzo.getContext('2d')!, clock.elapsedTime, desarme.current ?? 0)
    textura.needsUpdate = true
  })
  return (
    <group position={[0, 0, -0.1]}>
      <RoundedBox args={[1.64, 0.97, 0.06]} radius={0.02} position={[0, 0.82, 0]} castShadow><Oscuro /></RoundedBox>
      <RoundedBox args={[1.1, 0.6, 0.12]} radius={0.05} position={[0, 0.82, -0.07]} castShadow><Oscuro /></RoundedBox>
      <mesh position={[0, 0.82, 0.031]}>
        <planeGeometry args={[1.56, 0.88]} />
        <meshBasicMaterial map={textura} toneMapped={false} />
      </mesh>
      <RoundedBox args={[0.09, 0.44, 0.06]} radius={0.02} position={[0, 0.33, -0.14]} castShadow><Metal /></RoundedBox>
      <RoundedBox args={[0.56, 0.025, 0.3]} radius={0.012} position={[0, 0.0125, -0.1]} castShadow receiveShadow><Metal /></RoundedBox>
      <mesh position={[0.7, 0.34, 0.032]}><boxGeometry args={[0.03, 0.005, 0.005]} /><Brillo color="#beee11" k={2} /></mesh>
    </group>
  )
}

function Gabinete() {
  const ventiladores = useRef<THREE.Group[]>([])
  const anillos = useRef<THREE.MeshBasicMaterial[]>([])
  const luz = useRef<THREE.PointLight>(null)
  useFrame(({ clock }, dt) => {
    const tono = (clock.elapsedTime * 0.07) % 1
    ventiladores.current.forEach((v, i) => { if (v) v.rotation.z -= dt * (8 + i) })
    anillos.current.forEach((m, i) => m?.color.setHSL((tono + i * 0.08) % 1, 1, 0.55).multiplyScalar(2.6))
    luz.current?.color.setHSL(tono, 0.85, 0.55)
  })
  const aspas = Array.from({ length: 7 }, (_, b) => (b / 7) * Math.PI * 2)
  return (
    <group position={[1.5, 0, -0.2]}>
      <mesh position={[0.23, 0.5, 0]} castShadow><boxGeometry args={[0.02, 1, 0.95]} /><Oscuro /></mesh>
      <mesh position={[0, 0.99, 0]} castShadow><boxGeometry args={[0.48, 0.02, 0.95]} /><Oscuro /></mesh>
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow><boxGeometry args={[0.48, 0.03, 0.95]} /><Oscuro /></mesh>
      <mesh position={[0, 0.5, -0.465]} castShadow><boxGeometry args={[0.48, 1, 0.02]} /><Oscuro /></mesh>
      {/* vidrio templado */}
      <mesh position={[-0.236, 0.5, 0]}><boxGeometry args={[0.008, 0.96, 0.92]} />
        <meshPhysicalMaterial color="#9fb8cc" roughness={0.04} transparent opacity={0.14} depthWrite={false} /></mesh>
      <mesh position={[0, 0.5, 0.468]}><boxGeometry args={[0.46, 0.96, 0.008]} />
        <meshPhysicalMaterial color="#9fb8cc" roughness={0.04} transparent opacity={0.14} depthWrite={false} /></mesh>
      {/* placa de video y RAM */}
      <mesh position={[0.09, 0.42, 0.02]} castShadow><boxGeometry args={[0.22, 0.065, 0.56]} />
        <meshStandardMaterial color="#1b1e24" roughness={0.35} metalness={0.7} /></mesh>
      <mesh position={[-0.025, 0.44, 0.02]}><boxGeometry args={[0.004, 0.014, 0.5]} /><Brillo color="#66c0f4" k={3} /></mesh>
      {[0, 1, 2, 3].map(j => (
        <mesh key={j} position={[0.18, 0.79, 0.1 + j * 0.024]}><boxGeometry args={[0.04, 0.008, 0.01]} /><Brillo color="#beee11" k={3} /></mesh>
      ))}
      {/* ventiladores con anillo RGB */}
      {[0.75, 0.5, 0.25].map((y, i) => (
        <group key={y} position={[0, y, 0.43]}>
          <mesh><torusGeometry args={[0.1, 0.008, 12, 64]} />
            <meshBasicMaterial ref={m => { if (m) anillos.current[i] = m }} toneMapped={false} /></mesh>
          <group ref={g => { if (g) ventiladores.current[i] = g }}>
            {aspas.map(a => (
              <mesh key={a} position={[Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0]} rotation={[0.4, 0, a]}>
                <boxGeometry args={[0.07, 0.022, 0.004]} /><meshStandardMaterial color="#1c2027" roughness={0.5} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      <pointLight ref={luz} position={[0, 0.5, 0]} intensity={1.6} distance={1.8} decay={2} />
    </group>
  )
}

function Teclado() {
  const textura = useMemo(() => {
    const lienzo = Object.assign(document.createElement('canvas'), { width: 256, height: 4 })
    const g = lienzo.getContext('2d')!
    const degradado = g.createLinearGradient(0, 0, 256, 0)
    const arcoiris = ['#ff3b6b', '#ffb347', '#beee11', '#00e5ff', '#1a73e8', '#7b3fe4', '#ff3b6b']
    arcoiris.forEach((c, i) => degradado.addColorStop(i / (arcoiris.length - 1), c))
    g.fillStyle = degradado; g.fillRect(0, 0, 256, 4)
    const t = new THREE.CanvasTexture(lienzo)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    return t
  }, [])
  useFrame(({ clock }) => { textura.offset.x = clock.elapsedTime * 0.12 })
  const teclas = useMemo(() => Array.from({ length: 75 }, (_, i) => [-0.462 + (i % 15) * 0.066, 0.052, -0.132 + Math.floor(i / 15) * 0.066] as const), [])
  return (
    <group position={[-0.05, 0, 0.52]}>
      <RoundedBox args={[1.06, 0.036, 0.35]} radius={0.012} position={[0, 0.018, 0]} castShadow receiveShadow><Oscuro /></RoundedBox>
      <mesh position={[0, 0.037, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 0.31]} /><meshBasicMaterial map={textura} toneMapped={false} />
      </mesh>
      {teclas.map((p, i) => (
        <mesh key={i} position={p}><boxGeometry args={[0.056, 0.022, 0.056]} /><meshStandardMaterial color="#15181e" roughness={0.55} /></mesh>
      ))}
    </group>
  )
}

export function Escritorio({ desarme }: { desarme: RefObject<number> }) {
  return (
    <>
      <color attach="background" args={['#06080c']} />
      <fogExp2 attach="fog" args={['#06080c', 0.11]} />
      {/* pared y escritorio */}
      <mesh position={[0.3, 2.2, -1.25]} receiveShadow><planeGeometry args={[14, 7]} /><meshStandardMaterial color="#0c1118" roughness={0.92} /></mesh>
      <mesh position={[0.3, 1.75, -1.23]}><boxGeometry args={[5.2, 0.012, 0.012]} /><Brillo color="#1a73e8" k={1.6} /></mesh>
      <mesh position={[-2.3, 1.2, -1.23]}><boxGeometry args={[0.012, 2.2, 0.012]} /><Brillo color="#7b3fe4" k={1.6} /></mesh>
      <RoundedBox args={[3.8, 0.08, 1.6]} radius={0.02} position={[0.25, -0.04, 0.15]} receiveShadow>
        <meshStandardMaterial color="#15181e" roughness={0.32} metalness={0.35} />
      </RoundedBox>
      <mesh position={[0.25, -0.06, 0.955]}><boxGeometry args={[3.7, 0.012, 0.012]} /><Brillo color="#66c0f4" k={3} /></mesh>

      <Monitor desarme={desarme} />
      <Gabinete />
      <Teclado />

      {/* parlante, taza y mouse */}
      <RoundedBox args={[0.17, 0.32, 0.17]} radius={0.02} position={[-1.1, 0.16, -0.15]} castShadow><Oscuro /></RoundedBox>
      <mesh position={[-1.1, 0.2, -0.064]}><torusGeometry args={[0.05, 0.006, 10, 40]} /><Brillo color="#7b3fe4" k={3} /></mesh>
      <mesh position={[-1.05, 0.06, 0.45]} castShadow><cylinderGeometry args={[0.055, 0.05, 0.12, 32]} />
        <meshStandardMaterial color="#1a5fd0" roughness={0.35} metalness={0.1} /></mesh>
      <mesh position={[0.82, 0.028, 0.54]} scale={[0.055, 0.03, 0.09]} castShadow><sphereGeometry args={[1, 32, 24]} /><Oscuro /></mesh>

      {/* luces */}
      <hemisphereLight args={['#8fb3ff', '#080808', 0.6]} />
      <spotLight position={[-1.8, 3.2, 2.4]} intensity={25} distance={9} angle={0.55} penumbra={0.65} castShadow />
      <pointLight position={[0, 0.82, 0.4]} color="#66c0f4" intensity={1.4} distance={3} decay={2} />
      <pointLight position={[0, 0.95, -0.75]} color="#7b3fe4" intensity={3} distance={3.2} decay={2} />
      <pointLight position={[2.6, 1.8, -0.9]} color="#1a73e8" intensity={2} distance={5} decay={2} />
    </>
  )
}
