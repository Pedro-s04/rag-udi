import type { Destacado } from './api'

// La URL HLS del tráiler, o null si el juego no tiene uno que se pueda reproducir.
export function fuenteDeVideo(d: Destacado): string | null {
  return d.trailer?.hls || null
}
