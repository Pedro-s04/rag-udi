import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { useChat } from '@/lib/ChatProvider'
import { Chat } from './Chat'
import { FondoJuegos } from './FondoJuegos'
import { Pixel } from './Pixel'

export function Hero() {
  const { estado, pensando } = useChat()
  const animo = pensando ? 'pensando' : estado.respuesta ? 'feliz' : 'normal'
  return (
    <section id="chat" className="relative -mt-[88px] scroll-mt-24 px-4 pt-[88px] pb-24">
      <FondoJuegos />

      <div className="relative mx-auto grid max-w-[1180px] items-start gap-10 pt-8 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-[#22364d] bg-[rgba(13,19,28,.8)] py-1.5 pr-3 pl-1.5 text-[13px] text-texto">
            <span className="rounded-full bg-verde px-2 py-0.5 text-[11px] font-extrabold tracking-[.06em] text-[#0b1118]">NUEVO</span>
            RAG con Ollama · pgvector · Gemini
          </span>
          <h1 className="font-titulo text-4xl leading-[1.05] font-bold tracking-tight text-white xl:text-5xl">
            Encontrá tu próximo juego
            <AnimatedGradientText colorFrom="#66c0f4" colorTo="#beee11" className="block">en oferta, preguntando.</AnimatedGradientText>
          </h1>
          <div className="overflow-hidden rounded-lg border border-[#1c2c3e] bg-[rgba(5,9,13,.7)] px-3.5 py-2.5 font-mono text-sm text-[#8fa6bc]">
            <span className="text-verde">$ </span>
            <TypingAnimation className="leading-normal tracking-normal text-[#9fdcff]" typeSpeed={45} loop
              words={['pixel.buscar({ genero: "terror", coop: true })', 'pixel.buscar({ max_usd: 5, rpg: true })']} />
          </div>
          <p className="max-w-[540px] text-[17px] leading-relaxed text-[#acb2b8]">
            Pixel lee las ofertas de Steam, entiende lo que pedís y te devuelve los juegos que mejor encajan con tu precio y descuento.
          </p>
          <Pixel animo={animo} className="mx-auto hidden max-w-[190px] lg:block" />
        </div>
        <Chat variante="hero" />
      </div>
    </section>
  )
}
