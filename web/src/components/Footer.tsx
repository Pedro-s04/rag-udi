import { LogoSteam } from './LogoSteam'

const ENLACES = [
  ['#chat', 'Chat con Pixel'],
  ['#destacados', 'Juegos destacados'],
  ['#como-piensa', 'Cómo funciona'],
  ['#detras', 'Detrás de escena'],
] as const

// Footer al estilo de la tienda de Steam: continúa el degradado del fondo de la página.
export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-fondo via-[#0e141d] to-[#171a21] px-4 pt-16 pb-10 text-[#8f98a0]">
      <div className="mx-auto max-w-[1180px]">
        <div className="h-px bg-gradient-to-r from-transparent via-[#363c44] to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-6 py-8">
          <div className="flex items-center gap-4">
            <LogoSteam className="text-xl" />
            <span className="h-8 w-px bg-white/15" aria-hidden />
            <span className="font-titulo text-xl font-bold tracking-[.06em] text-white">OFERTAS<span className="text-verde">_RAG</span></span>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {ENLACES.map(([href, texto]) => (
              <a key={href} href={href} className="transition-colors hover:text-white">{texto}</a>
            ))}
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[#363c44] to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs">
          <p>© {new Date().getFullYear()} OFERTAS_RAG. Precios de la tienda de Steam para Argentina, en USD.</p>
          <p className="font-mono text-[11px] text-[#61686d]">Ollama · pgvector · Gemini</p>
        </div>
      </div>
    </footer>
  )
}
