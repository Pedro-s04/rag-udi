import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import type { Destacado } from '@/lib/api'
import { fuenteDeVideo } from '@/lib/video'

const ORIGEN = { 'mas-vendido': 'Más vendido', popular: 'Más jugado', oferta: 'Oferta' } as const
const usd = (n: number) => `USD ${n.toFixed(2)}`

// Al pasar el mouse: el tráiler real (HLS). Si no hay o no carga, rotan las capturas.
function Medios({ juego, activo }: { juego: Destacado; activo: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [fallo, setFallo] = useState(false)
  const [captura, setCaptura] = useState(-1)
  const fuente = fuenteDeVideo(juego)
  const conVideo = activo && fuente && !fallo

  useEffect(() => {
    const v = video.current
    if (!conVideo || !v || !fuente) return
    let hls: Hls | null = null
    const reproducir = () => v.play().catch(() => { /* el navegador puede bloquear el autoplay */ })
    if (Hls.isSupported()) {
      hls = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 10 })
      hls.on(Hls.Events.ERROR, (_e, datos) => { if (datos.fatal) setFallo(true) })
      hls.on(Hls.Events.MANIFEST_PARSED, reproducir)
      hls.loadSource(fuente)
      hls.attachMedia(v)
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = fuente
      v.addEventListener('loadedmetadata', reproducir, { once: true })
      v.addEventListener('error', () => setFallo(true), { once: true })
    } else {
      setFallo(true)
    }
    return () => { hls?.destroy(); v.removeAttribute('src'); v.load() }
  }, [conVideo, fuente])

  useEffect(() => {
    if (!activo || conVideo || juego.capturas.length === 0) { setCaptura(-1); return }
    setCaptura(0)
    const t = setInterval(() => setCaptura(c => (c + 1) % juego.capturas.length), 1500)
    return () => clearInterval(t)
  }, [activo, conVideo, juego.capturas.length])

  return (
    <div className="relative aspect-[460/215] overflow-hidden rounded-xl bg-[#0d131c]">
      <img src={juego.portada} alt={`Portada de ${juego.nombre}`} loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {captura >= 0 && (
        <img src={juego.capturas[captura]} alt="" className="entra absolute inset-0 size-full object-cover" />
      )}
      {conVideo && <video ref={video} muted playsInline loop className="absolute inset-0 size-full object-cover" />}
      {fuente && !activo && (
        <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] text-texto">▶ tráiler</span>
      )}
    </div>
  )
}

export function TarjetaJuego({ juego }: { juego: Destacado }) {
  const [activo, setActivo] = useState(false)
  return (
    <div onMouseEnter={() => setActivo(true)} onMouseLeave={() => setActivo(false)}
      onFocus={() => setActivo(true)} onBlur={() => setActivo(false)}>
      <CardContainer containerClassName="py-0" className="w-full">
        <CardBody className="group relative h-auto w-full rounded-2xl border border-borde bg-[#0b1119] p-3 transition-shadow hover:shadow-[0_0_0_1px_rgba(102,192,244,.4),0_24px_50px_rgba(0,0,0,.6),0_0_50px_rgba(102,192,244,.2)]">
          <CardItem translateZ={40} className="w-full">
            <Medios juego={juego} activo={activo} />
          </CardItem>
          <CardItem translateZ={25} className="mt-3 flex w-full items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-[10px] tracking-[.08em] text-celeste uppercase">{ORIGEN[juego.origen]}</span>
              <h3 className="truncate font-titulo text-base font-semibold text-white" title={juego.nombre}>{juego.nombre}</h3>
              <p className="truncate text-xs text-gris">{juego.generos.slice(0, 3).join(' · ') || 'Steam'}</p>
            </div>
            {juego.descuento > 0 && (
              <span className="shrink-0 rounded-md bg-verde px-1.5 py-0.5 font-titulo text-sm font-bold text-[#0b1118]">-{juego.descuento}%</span>
            )}
          </CardItem>
          <CardItem translateZ={15} className="mt-2 flex w-full items-center justify-between">
            <span className="text-sm">
              {juego.gratis ? <span className="font-semibold text-verde">Gratis</span> : (
                <>
                  {juego.descuento > 0 && <s className="mr-2 text-xs text-gris">{usd(juego.precioOriginal)}</s>}
                  <span className="font-semibold text-white">{usd(juego.precio)}</span>
                </>
              )}
            </span>
            <a href={juego.tienda} target="_blank" rel="noreferrer" className="text-xs font-semibold text-celeste hover:text-white">
              Ver en Steam →
            </a>
          </CardItem>
          {!juego.enCorpus && (
            <p className="mt-2 font-mono text-[10px] text-gris">Pixel todavía no lo conoce</p>
          )}
        </CardBody>
      </CardContainer>
    </div>
  )
}
