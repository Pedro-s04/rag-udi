import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Spotlight } from '@/components/ui/spotlight-new'
import { Escritorio } from '@/escena/Escritorio'
import { Lienzo } from '@/escena/Lienzo'
import { soportaWebGL } from '@/escena/soportaWebGL'

const FRENTE = new THREE.Vector3(0.3, 1.25, 3.9)
const MIRA = new THREE.Vector3(0.3, 0.55, 0)

// De frente al escritorio; el mouse mueve un poco la cámara ("mirar alrededor").
function CamaraFrente() {
  const suave = useRef({ x: 0, y: 0 })
  useFrame(({ camera, pointer, clock }) => {
    suave.current.x += (pointer.x - suave.current.x) * 0.05
    suave.current.y += (pointer.y - suave.current.y) * 0.05
    const t = clock.elapsedTime
    camera.position.set(
      FRENTE.x + suave.current.x * 0.45 + Math.sin(t * 0.3) * 0.05,
      FRENTE.y + suave.current.y * 0.2 + Math.sin(t * 0.4) * 0.02,
      FRENTE.z,
    )
    camera.lookAt(MIRA)
  })
  return null
}

export function SeccionPC({ onEntrar }: { onEntrar: () => void }) {
  const desarme = useRef(0)
  const con3D = soportaWebGL()
  return (
    <section id="detras" className="relative scroll-mt-24 overflow-hidden px-4 py-20">
      <Spotlight />
      <div className="relative mx-auto max-w-[1180px]">
        <p className="font-mono text-xs tracking-[.12em] text-verde">04 · DETRÁS DE ESCENA</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-titulo text-3xl font-bold text-white">Entrá a la PC de Pixel</h2>
            <p className="mt-2 max-w-[620px] text-[#acb2b8]">
              Chateá con Pixel y mirá en vivo cada paso del RAG: tu pregunta reescrita, el vector, la búsqueda en pgvector, el prompt que recibe Gemini y la respuesta final.
            </p>
          </div>
          <ShimmerButton onClick={onEntrar} background="#1a73e8" shimmerColor="#beee11" className="px-6 py-3 font-titulo text-base font-bold">
            Ver detrás de escena
          </ShimmerButton>
        </div>
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-borde bg-[#06080c] shadow-[0_30px_80px_rgba(0,0,0,.6)]">
          {con3D ? (
            <Lienzo etiqueta="Escritorio gamer en 3D con la PC de Pixel">
              <CamaraFrente />
              <Escritorio desarme={desarme} />
            </Lienzo>
          ) : (
            <img src="/pc-respaldo.jpg" alt="El escritorio gamer con la PC de Pixel" className="size-full object-cover" />
          )}
          <button type="button" onClick={onEntrar} aria-label="Entrar a la PC de Pixel"
            className="absolute inset-0 cursor-pointer bg-transparent" />
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-gris">
            {con3D ? 'mové el mouse para mirar alrededor · click para entrar' : 'click para entrar'}
          </span>
        </div>
      </div>
    </section>
  )
}
