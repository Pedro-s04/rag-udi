import { RetroGrid } from '@/components/ui/retro-grid'
import { ShimmerButton } from '@/components/ui/shimmer-button'

export default function App() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-fondo">
      <RetroGrid />
      <ShimmerButton className="font-titulo">Ver detrás de escena</ShimmerButton>
    </main>
  )
}
