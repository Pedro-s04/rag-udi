import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import type { Destacado } from '@/lib/api'
import { fuenteDeVideo } from '@/lib/video'

// La pantalla de adentro de la caja: el tráiler real (HLS) mientras está abierta.
// Si no hay tráiler o no carga, rotan las capturas sobre la portada.
export function PantallaTrailer({ juego, activo }: { juego: Destacado; activo: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [fallo, setFallo] = useState(false)
  const [captura, setCaptura] = useState(-1)
  const fuente = fuenteDeVideo(juego)
  const conVideo = activo && !!fuente && !fallo

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
    <div className="relative size-full overflow-hidden bg-black">
      <img src={juego.portada} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-60" />
      {captura >= 0 && <img src={juego.capturas[captura]} alt="" className="entra absolute inset-0 size-full object-cover" />}
      {conVideo && <video ref={video} muted playsInline loop className="absolute inset-0 size-full object-cover" />}
      {/* reflejo de vidrio de la pantalla */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.12),transparent_40%)]" />
    </div>
  )
}
