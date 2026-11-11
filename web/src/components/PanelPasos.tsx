import { useState, type ReactNode } from 'react'
import { useChat } from '@/lib/ChatProvider'

const ms = (n: number) => `${Math.round(n)} ms`

type EstadoPaso = 'listo' | 'trabajando' | 'esperando'

function Paso({ n, titulo, tecnologia, estado, children }: {
  n: number; titulo: string; tecnologia: string; estado: EstadoPaso; children?: ReactNode
}) {
  const color = estado === 'listo' ? 'border-celeste/50' : estado === 'trabajando' ? 'border-verde shadow-[0_0_24px_rgba(190,238,17,.25)]' : 'border-borde opacity-60'
  return (
    <li className={`entra rounded-xl border bg-[rgba(11,17,25,.88)] p-3 backdrop-blur-sm transition ${color}`}>
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-[#14202e] font-mono text-xs text-celeste">{n}</span>
        <h3 className="font-titulo text-sm font-semibold text-white">{titulo}</h3>
        <span className="font-mono text-[11px] text-gris">{tecnologia}</span>
        <span className={`ml-auto font-mono text-[11px] ${estado === 'trabajando' ? 'text-verde' : 'text-gris'}`}>
          {estado === 'trabajando' ? '● trabajando' : estado === 'listo' ? '✓' : '…'}
        </span>
      </div>
      {children && <div className="mt-2 text-[13px] text-texto">{children}</div>}
    </li>
  )
}

export function PanelPasos() {
  const { estado } = useChat()
  const [verPrompt, setVerPrompt] = useState(false)
  const { pasos, respuesta, fase } = estado
  const buscando = fase === 'buscando'
  const deBusqueda: EstadoPaso = pasos ? 'listo' : buscando ? 'trabajando' : 'esperando'

  if (!pasos && !buscando && !respuesta) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-borde bg-[rgba(11,17,25,.92)] p-6 text-center">
        <p className="max-w-xs text-gris">Preguntale algo a Pixel y acá vas a ver, paso a paso, todo lo que hace para responderte.</p>
      </div>
    )
  }

  return (
    <ol className="flex h-full flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
      <Paso n={0} titulo="Reescribe la pregunta" tecnologia="Gemini" estado={deBusqueda}>
        {pasos && (
          <>
            <p className="font-mono text-verde">“{pasos.reescritura.consulta}”</p>
            <p className="font-mono text-[11px] text-gris">{ms(pasos.reescritura.ms)}</p>
            {pasos.reescritura.error && <p className="mt-1 text-xs text-amber-300">Gemini no pudo reescribirla: se buscó con la pregunta tal cual.</p>}
          </>
        )}
      </Paso>

      <Paso n={1} titulo="La convierte en vector" tecnologia="Ollama · bge-m3" estado={deBusqueda}>
        {pasos && (
          <p className="font-mono text-xs break-all text-[#9fdcff]">
            [{pasos.vector.map(v => v.toFixed(3)).join(', ')}, …]
            <span className="block text-[11px] text-gris">{pasos.dimensiones} números · {ms(pasos.msEmbedding)}</span>
          </p>
        )}
      </Paso>

      <Paso n={2} titulo="Busca los fragmentos más parecidos" tecnologia="Postgres + pgvector" estado={deBusqueda}>
        {pasos && (
          <>
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[10px] text-gris uppercase"><tr><th className="py-1">Juego</th><th>Similitud</th><th>Precio</th><th>Dto.</th><th /></tr></thead>
              <tbody>
                {pasos.resultados.map(r => (
                  <tr key={r.seccion + r.fuente} className="border-t border-borde">
                    <td className="py-1.5">
                      <span className="flex items-center gap-2">
                        {r.appid && (
                          <img src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${r.appid}/header.jpg`} alt=""
                            className="h-5 w-11 rounded object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                        )}
                        <span className="text-white">{r.seccion}</span>
                      </span>
                    </td>
                    <td className="font-mono text-celeste">{r.similitud.toFixed(3)}</td>
                    <td className="font-mono">{r.precio == null ? '—' : r.precio === 0 ? 'gratis' : `$${r.precio.toFixed(2)}`}</td>
                    <td className="font-mono text-verde">{r.descuento ? `-${r.descuento}%` : '—'}</td>
                    <td className={`font-mono text-[10px] ${r.util ? 'text-verde' : 'text-red-300'}`}>{r.util ? 'útil' : 'descartado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 font-mono text-[11px] text-gris">ORDER BY similitud DESC LIMIT 3 · umbral {pasos.umbral} · {ms(pasos.msBusqueda)}</p>
          </>
        )}
      </Paso>

      <Paso n={3} titulo="Arma el prompt" tecnologia="contexto + pregunta" estado={pasos ? 'listo' : 'esperando'}>
        {pasos && (pasos.prompt ? (
          <>
            <button type="button" onClick={() => setVerPrompt(v => !v)} className="font-mono text-xs text-celeste hover:text-white">
              {verPrompt ? '▾ ocultar prompt' : `▸ ver el prompt (${pasos.prompt.length} caracteres)`}
            </button>
            {verPrompt && <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-[#05090d] p-2 font-mono text-[11px] whitespace-pre-wrap text-[#8fa6bc]">{pasos.prompt}</pre>}
          </>
        ) : <p className="text-xs text-gris">Ningún fragmento pasó el umbral: no se llama a Gemini.</p>)}
      </Paso>

      <Paso n={4} titulo="Responde" tecnologia="Gemini" estado={respuesta ? 'listo' : fase === 'respondiendo' ? 'trabajando' : 'esperando'}>
        {respuesta && (
          <>
            <p className="whitespace-pre-wrap">{respuesta.texto}</p>
            {respuesta.ms > 0 && <p className="mt-1 font-mono text-[11px] text-gris">{ms(respuesta.ms)}</p>}
          </>
        )}
      </Paso>
    </ol>
  )
}
