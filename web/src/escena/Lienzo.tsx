// El <Canvas> común de la PC: sombras, bloom para los LEDs y tamaño del contenedor.
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

export function Lienzo({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 35, near: 0.01, far: 60, position: [0, 1.1, 3.2] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }} aria-label={etiqueta} role="img">
      {children}
      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.55} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
