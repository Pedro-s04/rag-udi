import { useState } from 'react'
import { ComoPiensa } from '@/components/ComoPiensa'
import { Destacados } from '@/components/Destacados'
import { Hero } from '@/components/Hero'
import { Navbar } from '@/components/Navbar'
import { SeccionPC } from '@/components/SeccionPC'
import { ChatProvider } from '@/lib/ChatProvider'

export default function App() {
  const [, setAdentro] = useState(false)
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
        <footer className="border-t border-borde px-4 py-8 text-center font-mono text-xs text-gris">
          Proyecto independiente, sin afiliación con Valve. Precios y datos de Steam. · ollama · pgvector · gemini
        </footer>
      </div>
    </ChatProvider>
  )
}
