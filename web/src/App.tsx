import { useState } from 'react'
import { Destacados } from '@/components/Destacados'
import { Hero } from '@/components/Hero'
import { Navbar } from '@/components/Navbar'
import { ChatProvider } from '@/lib/ChatProvider'

export default function App() {
  const [, setAdentro] = useState(false)
  return (
    <ChatProvider>
      <div className="relative min-h-screen overflow-x-clip bg-fondo font-sans text-texto">
        <Navbar onDetras={() => setAdentro(true)} />
        <main>
          <Hero />
          <Destacados />
        </main>
      </div>
    </ChatProvider>
  )
}
