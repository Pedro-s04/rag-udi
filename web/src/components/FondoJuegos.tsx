import { useEffect, useMemo, useState } from 'react'
import { Marquee } from '@/components/ui/marquee'
import { juegos as pedirJuegos, type Destacado } from '@/lib/api'

const FILAS = 6

// Fondo del hero: filas inclinadas de portadas y capturas reales que van pasando
// (como el arte de Steam), oscurecidas para que el título y el chat se lean.
export function FondoJuegos() {
  const [juegos, setJuegos] = useState<Destacado[]>([])
  useEffect(() => { pedirJuegos().then(setJuegos, () => setJuegos([])) }, [])

  const filas = useMemo(() => {
    const imagenes = juegos.flatMap(j => [j.portada, ...j.capturas.slice(0, 1)]).filter(Boolean)
    return Array.from({ length: FILAS }, (_, f) =>
      imagenes.filter((_, i) => i % FILAS === f).concat(imagenes.filter((_, i) => i % FILAS === (f + 3) % FILAS)))
  }, [juegos])

  if (juegos.length === 0) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 flex w-[180%] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] flex-col gap-4">
        {filas.map((fila, f) => (
          <Marquee key={f} reverse={f % 2 === 1} repeat={2}
            className="p-0 [--gap:1rem]" style={{ ['--duration' as string]: `${70 + f * 9}s` }}>
            {fila.map((src, i) => (
              <img key={src + i} src={src} alt="" decoding="async"
                className="h-[150px] w-[320px] rounded-lg object-cover shadow-[0_10px_30px_rgba(0,0,0,.6)]" />
            ))}
          </Marquee>
        ))}
      </div>
      {/* velo: oscurece las imágenes y se funde con el fondo de la página */}
      <div className="absolute inset-0 bg-[#0b1220]/50" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,transparent,rgba(5,7,11,.7))]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-fondo" />
    </div>
  )
}
