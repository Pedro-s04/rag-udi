import { ShineBorder } from '@/components/ui/shine-border'

const PASOS = [
  { titulo: 'Te escucha', tecnologia: 'Gemini', texto: 'Reescribe tu pregunta con las palabras de las fichas de Steam y le suma tus filtros de precio y descuento.' },
  { titulo: 'Lo traduce', tecnologia: 'Ollama · bge-m3', texto: 'Tu pregunta se convierte en un vector de 1024 números que captura su significado.' },
  { titulo: 'Busca en el archivo', tecnologia: 'Postgres + pgvector', texto: 'Trae los juegos más parecidos que cumplen tus filtros.' },
  { titulo: 'Te responde', tecnologia: 'Gemini', texto: 'Recomienda usando solo las ofertas que encontró, y cita de dónde lo sacó.' },
]

export function ComoPiensa() {
  return (
    <section id="como-piensa" className="relative scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-[1180px]">
        <p className="font-mono text-xs tracking-[.12em] text-verde">03 · PIPELINE</p>
        <h2 className="mt-2 font-titulo text-3xl font-bold text-white">Cómo piensa Pixel</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="relative overflow-hidden rounded-2xl border border-borde bg-[#0b1119] p-5">
              <ShineBorder shineColor={['#66c0f4', '#beee11']} duration={10 + i * 2} />
              <span className="font-mono text-xs text-celeste">0{i + 1}</span>
              <h3 className="mt-1 font-titulo text-xl font-semibold text-white">{p.titulo}</h3>
              <p className="font-mono text-xs text-verde">{p.tecnologia}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#acb2b8]">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
