import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Circuito } from '@/escena/Circuito'
import { Escritorio } from '@/escena/Escritorio'
import { Lienzo } from '@/escena/Lienzo'
import { LimiteEscena } from '@/escena/LimiteEscena'
import { hayWebGL } from '@/escena/soportaWebGL'
import { useChat } from '@/lib/ChatProvider'
import { etapaActiva, type Etapa } from '@/lib/conversacion'
import { momentoEntrada } from '@/lib/entrada'
import { Chat } from './Chat'
import { PanelPasos } from './PanelPasos'

type Fase = 'entrando' | 'adentro' | 'saliendo'
const SALIDA_MS = 400

const sinMovimiento = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Mueve la cámara según la línea de tiempo y avisa cuando terminó de entrar.
function Recorrido({ desarme, circuito, saltar, onListo }: {
  desarme: { current: number }; circuito: { current: number }; saltar: boolean; onListo: () => void
}) {
  const inicio = useRef<number | null>(null)
  const avisado = useRef(false)
  const mira = useRef(new THREE.Vector3())
  useFrame(({ camera }) => {
    inicio.current ??= performance.now()
    const m = momentoEntrada(saltar ? Infinity : performance.now() - inicio.current)
    camera.position.set(...m.camara)
    camera.lookAt(mira.current.set(...m.mira))
    desarme.current = m.desarme
    circuito.current = m.circuito
    if (m.listo && !avisado.current) { avisado.current = true; onListo() }
  })
  return null
}

// La etapa que se dibuja en el circuito: "reescribir" es el primer tramo de la búsqueda.
function useEtapaVisual(): Etapa | null {
  const { estado } = useChat()
  const etapa = etapaActiva(estado)
  const [primerTramo, setPrimerTramo] = useState(false)
  useEffect(() => {
    if (etapa !== 'busqueda') return
    setPrimerTramo(true)
    const t = setTimeout(() => setPrimerTramo(false), 600)
    return () => clearTimeout(t)
  }, [etapa])
  return etapa === 'busqueda' && primerTramo ? 'reescribir' : etapa
}

export function DetrasDeEscena({ onSalir }: { onSalir: () => void }) {
  const con3D = hayWebGL()
  const directo = !con3D || sinMovimiento()
  const [fase, setFase] = useState<Fase>(directo ? 'adentro' : 'entrando')
  const desarme = useRef(0)
  const circuito = useRef(0)
  const etapa = useEtapaVisual()

  const salir = () => {
    setFase('saliendo')
    setTimeout(onSalir, directo ? 0 : SALIDA_MS)
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') salir() }
    window.addEventListener('keydown', tecla)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = overflow }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fondo = <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(26,115,232,.25),transparent_70%)]" />

  return (
    <div role="dialog" aria-modal="true" aria-label="Dentro de la PC de Pixel"
      className={`fixed inset-0 z-50 bg-fondo transition-opacity duration-[400ms] ${fase === 'saliendo' ? 'opacity-0' : 'opacity-100'}`}>
      {con3D ? (
        <div className="absolute inset-0">
          <LimiteEscena respaldo={fondo} onFallo={() => setFase(f => (f === 'entrando' ? 'adentro' : f))}>
          <Lienzo etiqueta="Interior de la PC de Pixel: la placa madre con la CPU, el SSD y la GPU">
            <Recorrido desarme={desarme} circuito={circuito} saltar={directo} onListo={() => setFase(f => (f === 'entrando' ? 'adentro' : f))} />
            <Escritorio desarme={desarme} />
            <group position={[-0.04, 0.82, -0.02]} scale={0.2}>
              <Circuito etapa={etapa} opacidad={circuito} />
            </group>
          </Lienzo>
          </LimiteEscena>
        </div>
      ) : fondo}

      {fase === 'entrando' && (
        <p className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 font-titulo text-lg tracking-[.2em] text-celeste">
          ENTRANDO A LA PC DE PIXEL…
        </p>
      )}

      {fase !== 'entrando' && (
        <div className="emerge absolute inset-0 flex flex-col gap-4 p-4 lg:p-6">
          <header className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-verde px-2.5 py-1 text-[11px] font-extrabold tracking-[.08em] text-[#0b1118]">MODO DETRÁS DE ESCENA</span>
            <h2 className="font-titulo text-xl font-bold text-white">Dentro de la PC de Pixel</h2>
            <span className="hidden font-mono text-xs text-gris md:inline">la luz recorre la pieza que está trabajando · Esc para salir</span>
            <button type="button" onClick={salir}
              className="ml-auto rounded-full border border-celeste/40 bg-[rgba(13,19,28,.8)] px-4 py-2 text-sm font-semibold text-white hover:bg-celeste/15">
              Salir de la PC
            </button>
          </header>
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,380px)_1fr_minmax(420px,520px)]">
            <div className="min-h-[360px] lg:min-h-0"><Chat variante="adentro" /></div>
            <div className="hidden lg:block" aria-hidden />
            <div className="min-h-0">
              <p className="mb-2 font-mono text-xs tracking-[.12em] text-verde">LO QUE PASA ADENTRO</p>
              <div className="h-[calc(100%-1.5rem)]"><PanelPasos /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
