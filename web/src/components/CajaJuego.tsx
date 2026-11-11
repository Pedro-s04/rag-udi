import { useState } from 'react'
import type { Destacado } from '@/lib/api'
import { LogoSteam } from './LogoSteam'
import { PantallaTrailer } from './PantallaTrailer'

const ORIGEN = { 'mas-vendido': 'Más vendido', popular: 'Más jugado', oferta: 'Oferta' } as const
const usd = (n: number) => `USD ${n.toFixed(2)}`

function Precio({ juego }: { juego: Destacado }) {
  if (juego.gratis) return <span className="font-titulo text-lg font-bold text-verde">Gratis</span>
  return (
    <span className="flex flex-col whitespace-nowrap">
      {juego.descuento > 0 && <s className="text-xs text-[#8f98a0]">{usd(juego.precioOriginal)}</s>}
      <span className="font-titulo text-lg leading-tight font-bold text-white">{usd(juego.precio)}</span>
    </span>
  )
}

// Una caja de juego física: cerrada e inclinada; al pasar el mouse se endereza y se abre
// como un libro. Adentro, en la tapa, la info del juego; donde iría el disco, una pantalla
// con el tráiler y el botón para ir a Steam.
export function CajaJuego({ juego }: { juego: Destacado }) {
  const [abierta, setAbierta] = useState(false)
  const tapa = juego.caja ?? juego.portada

  return (
    <div className="caja-escena relative aspect-[600/960] outline-none" data-abierta={abierta} tabIndex={0}
      aria-label={`${juego.nombre}: abrir la caja`}
      onMouseEnter={() => setAbierta(true)} onMouseLeave={() => setAbierta(false)}
      onFocus={() => setAbierta(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAbierta(false) }}>
      <div className="caja">
        {/* bandeja: lo que queda a la vista cuando se abre la tapa */}
        <div className="caja-bandeja">
          <div className="caja-borde" />
          <div className="flex size-full flex-col justify-center gap-3 p-3 pl-4">
            <div className="caja-pantalla aspect-[4/5] w-full overflow-hidden rounded-xl border-4 border-[#0d1117]">
              <PantallaTrailer juego={juego} activo={abierta} />
            </div>
            <p className="text-center font-mono text-[10px] tracking-[.14em] text-[#8f98a0]">▶ TRÁILER OFICIAL</p>
            <a href={juego.tienda} target="_blank" rel="noreferrer" tabIndex={abierta ? 0 : -1}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#06bfff] to-[#2d73ff] py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(45,115,255,.45)] transition hover:brightness-110">
              <LogoSteam conTexto={false} className="text-sm" /> Ver en Steam
            </a>
          </div>
        </div>

        {/* tapa: adelante la portada, atrás la info del juego */}
        <div className="caja-tapa">
          <div className="caja-cara caja-frente">
            <div className="flex h-[7%] items-center justify-between bg-gradient-to-b from-[#1b2838] to-[#171d25] px-2.5">
              <LogoSteam className="text-[11px]" />
              <span className="font-mono text-[8px] tracking-[.14em] text-[#66c0f4]">{ORIGEN[juego.origen].toUpperCase()}</span>
            </div>
            <img src={tapa} alt={`Caja de ${juego.nombre}`} loading="lazy" className="h-[93%] w-full object-cover" />
            {juego.descuento > 0 && (
              <span className="absolute top-[10%] right-2 rotate-6 rounded-md bg-verde px-2 py-1 font-titulo text-sm font-bold text-[#0b1118] shadow-lg">-{juego.descuento}%</span>
            )}
            <div className="caja-brillo" />
          </div>
          <div className="caja-cara caja-dorso flex flex-col gap-2 p-4">
            <span className="font-mono text-[10px] tracking-[.12em] text-celeste">{ORIGEN[juego.origen].toUpperCase()}</span>
            <h3 className="font-titulo text-xl leading-tight font-bold text-white">{juego.nombre}</h3>
            <div className="flex flex-wrap gap-1">
              {juego.generos.slice(0, 4).map(g => (
                <span key={g} className="rounded-full border border-[#22364d] bg-[#0d131c] px-2 py-0.5 text-[10px] text-[#9fdcff]">{g}</span>
              ))}
            </div>
            <img src={juego.portada} alt="" loading="lazy" className="mt-1 w-full rounded-md object-cover" />
            <div className="mt-auto flex items-end justify-between gap-2">
              <Precio juego={juego} />
              {juego.descuento > 0 && <span className="rounded bg-verde px-1.5 py-0.5 font-titulo text-sm font-bold text-[#0b1118]">-{juego.descuento}%</span>}
            </div>
            {!juego.enCorpus && <p className="font-mono text-[10px] text-[#8f98a0]">Pixel todavía no lo conoce</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
