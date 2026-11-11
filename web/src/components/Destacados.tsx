import { useEffect, useMemo, useState } from 'react'
import { Marquee } from '@/components/ui/marquee'
import { juegos as pedirJuegos, type Destacado } from '@/lib/api'
import { CajaJuego } from './CajaJuego'

type Filtro = 'todos' | Destacado['origen']
const FILTROS: [Filtro, string][] = [['todos', 'Todos'], ['mas-vendido', 'Más vendidos'], ['popular', 'Más jugados'], ['oferta', 'Ofertas']]

export function Destacados() {
  const [juegos, setJuegos] = useState<Destacado[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  useEffect(() => {
    pedirJuegos().then(setJuegos, e => setError(e.message))
  }, [])

  const generos = useMemo(() => [...new Set((juegos ?? []).flatMap(j => j.generos))], [juegos])
  const visibles = (juegos ?? []).filter(j => filtro === 'todos' || j.origen === filtro)

  return (
    <section id="destacados" className="relative scroll-mt-24 px-4 py-20">
      <div className="mx-auto max-w-[1180px]">
        <p className="font-mono text-xs tracking-[.12em] text-verde">02 · STEAM AHORA</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-titulo text-3xl font-bold text-white">Juegos destacados de Steam</h2>
          <div className="flex flex-wrap gap-1 rounded-full border border-borde bg-[#0b1119] p-1" role="tablist" aria-label="Filtrar juegos">
            {FILTROS.map(([valor, nombre]) => (
              <button key={valor} type="button" role="tab" aria-selected={filtro === valor} onClick={() => setFiltro(valor)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${filtro === valor ? 'bg-celeste text-fondo' : 'text-[#acb2b8] hover:text-white'}`}>
                {nombre}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-gris">Los más vendidos, los más jugados y las ofertas más conocidas, con precios reales de la tienda. Pasá el mouse por una caja para abrirla y ver el tráiler.</p>
      </div>

      {generos.length > 0 && (
        <Marquee pauseOnHover className="mt-6 [--duration:40s] [--gap:.75rem]">
          {generos.map(g => (
            <span key={g} className="rounded-full border border-[#22364d] bg-[#0d131c] px-3 py-1 font-mono text-xs text-[#9fdcff]">#{g}</span>
          ))}
        </Marquee>
      )}

      <div className="mx-auto mt-6 max-w-[1180px]">
        {error && <p className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-200">No pude cargar los juegos: {error}</p>}
        {!juegos && !error && <p className="text-gris">Cargando juegos de Steam…</p>}
        <div className="grid grid-cols-2 gap-x-8 gap-y-14 px-2 pt-6 lg:grid-cols-5">
          {visibles.map(j => <CajaJuego key={j.appid} juego={j} />)}
        </div>
      </div>
    </section>
  )
}
