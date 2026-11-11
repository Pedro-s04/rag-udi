import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BorderBeam } from '@/components/ui/border-beam'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useChat } from '@/lib/ChatProvider'
import type { Mensaje } from '@/lib/conversacion'

const SUGERENCIAS = [
  { titulo: 'Terror cooperativo', pista: 'Para jugar con amigos de noche', pregunta: '¿Qué juego de terror multijugador me recomendás?' },
  { titulo: 'Carreras arcade', pista: 'Rápido, música y neón', pregunta: 'Busco un juego de carreras arcade barato' },
  { titulo: 'RPG de fantasía', pista: 'Historias largas para perderse', pregunta: 'Quiero un RPG de fantasía con buena historia' },
  { titulo: 'Exploración espacial', pista: 'Naves, planetas y calma', pregunta: 'Algo de exploración espacial relajado' },
]

// Separa el renglón "Fuente:" que agrega el modelo para mostrarlo aparte.
function partir(texto: string) {
  const i = texto.search(/\n\s*Fuente:/)
  if (i === -1) return { cuerpo: texto, fuente: null }
  // "Fuente: -- ofertas-steam.md · ## Ghost Exile --" → "Fuente: ofertas-steam.md · Ghost Exile"
  const fuente = texto.slice(i).trim().replace(/-{2,}/g, '').replace(/#+\s*/g, '').replace(/\s+/g, ' ').trim()
  return { cuerpo: texto.slice(0, i).trim(), fuente }
}

function Burbuja({ m }: { m: Mensaje }) {
  if (m.quien === 'usuario') {
    return <div className="entra ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-[#1a2f45] px-4 py-2.5 text-[15px] text-white">{m.texto}</div>
  }
  const { cuerpo, fuente } = partir(m.texto)
  return (
    <div className={`entra max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[15px] leading-relaxed ${
      m.error ? 'border border-red-500/40 bg-red-950/50 text-red-200' : 'bg-[#111a26] text-texto'}`}>
      <p className="whitespace-pre-wrap">{cuerpo}</p>
      {fuente && <p className="mt-2 font-mono text-xs text-gris">{fuente}</p>}
    </div>
  )
}

export function Chat({ variante }: { variante: 'hero' | 'adentro' }) {
  const { estado, enviar, pensando } = useChat()
  const [texto, setTexto] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [descuentoMin, setDescuentoMin] = useState('')
  const lista = useRef<HTMLDivElement>(null)

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }, [estado.mensajes.length, pensando])

  const mandar = (e: FormEvent) => {
    e.preventDefault()
    if (!texto.trim() || pensando) return
    enviar(texto, {
      precioMax: precioMax === '' ? undefined : Number(precioMax),
      descuentoMin: descuentoMin === '' ? undefined : Number(descuentoMin),
    })
    setTexto('')
  }

  const campo = 'rounded-lg border border-[#2a3a4d] bg-[#05090d] px-3 py-2 text-sm text-white placeholder:text-gris focus:border-celeste focus:outline-none'

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-[#1c2c3e] bg-[rgba(10,15,22,.86)] shadow-[0_-10px_60px_rgba(26,115,232,.18),0_30px_60px_rgba(0,0,0,.5)] backdrop-blur-md ${
      variante === 'hero' ? 'h-[560px] max-h-[calc(100vh-120px)] min-h-[440px]' : 'h-full'}`}>
      <div className="flex items-center gap-2 border-b border-[#1c2c3e] px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" /><span className="size-3 rounded-full bg-[#febc2e]" /><span className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-2.5 font-mono text-xs text-gris">~/ofertas-rag › chat con Pixel</span>
        <span className={`ml-auto font-mono text-xs ${pensando ? 'text-verde' : 'text-gris'}`}>
          ● {estado.fase === 'buscando' ? 'buscando ofertas…' : estado.fase === 'respondiendo' ? 'escribiendo…' : 'en línea'}
        </span>
      </div>

      <div ref={lista} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {estado.mensajes.map(m => <Burbuja key={m.id} m={m} />)}
        {pensando && (
          <div className="max-w-fit rounded-2xl rounded-bl-sm bg-[#111a26] px-4 py-2.5 text-celeste" aria-label="Pixel está pensando">
            <span className="punto">●</span> <span className="punto">●</span> <span className="punto">●</span>
          </div>
        )}
        {variante === 'hero' && estado.mensajes.length === 1 && (
          <div className="mt-auto grid grid-cols-2 gap-2 lg:grid-cols-4">
            {SUGERENCIAS.map(s => (
              <button key={s.titulo} type="button" onClick={() => setTexto(s.pregunta)}
                className="rounded-xl border border-[#22364d] bg-[#0d131c] p-3 text-left transition hover:-translate-y-0.5 hover:border-celeste">
                <span className="block font-titulo text-sm font-semibold text-white">{s.titulo}</span>
                <span className="block text-xs text-gris">{s.pista}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={mandar} className="flex flex-col gap-3 border-t border-[#1c2c3e] p-4">
        <div className="flex gap-2">
          <label htmlFor={`pregunta-${variante}`} className="sr-only">Mensaje para Pixel</label>
          <input id={`pregunta-${variante}`} value={texto} onChange={e => setTexto(e.target.value)} autoComplete="off"
            placeholder="Preguntale a Pixel: terror para jugar con amigos…" className={`${campo} flex-1 font-mono text-[15px]`} />
          <ShimmerButton type="submit" disabled={pensando || !texto.trim()} background="#1a73e8" shimmerColor="#beee11"
            className="px-5 py-2 font-titulo text-sm font-bold disabled:opacity-50">
            Enviar
          </ShimmerButton>
        </div>
        {variante === 'hero' && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-gris">
            <span>filtros opcionales:</span>
            <label className="flex items-center gap-2">máx USD
              <input type="number" min="0" step="0.01" value={precioMax} onChange={e => setPrecioMax(e.target.value)} className={`${campo} w-24`} />
            </label>
            <label className="flex items-center gap-2">mín descuento %
              <input type="number" min="0" max="100" value={descuentoMin} onChange={e => setDescuentoMin(e.target.value)} className={`${campo} w-20`} />
            </label>
          </div>
        )}
      </form>
      <BorderBeam size={120} duration={8} colorFrom="#66c0f4" colorTo="#beee11" />
    </div>
  )
}
