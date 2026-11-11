import { useState } from 'react'
import { ComoPiensa } from '@/components/ComoPiensa'
import { Destacados } from '@/components/Destacados'
import { DetrasDeEscena } from '@/components/DetrasDeEscena'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Navbar } from '@/components/Navbar'
import { SeccionPC } from '@/components/SeccionPC'
import { ChatProvider } from '@/lib/ChatProvider'

export default function App() {
  const [adentro, setAdentro] = useState(false)
  const entrar = () => setAdentro(true)
  return (
    <ChatProvider>
      <div className="relative min-h-screen overflow-x-clip bg-fondo font-sans text-texto">
        <Navbar onDetras={entrar} />
        <main>
          <Hero />
          <Destacados />
          <ComoPiensa />
          <SeccionPC onEntrar={entrar} />
        </main>
        <Footer />
      </div>
      {adentro && <DetrasDeEscena onSalir={() => setAdentro(false)} />}
    </ChatProvider>
  )
}
