// La línea de tiempo de "Ver detrás de escena" (opción C: pantalla → circuito).
//   0–1200 ms     la cámara avanza de frente hasta que la pantalla llena la vista
//   1200–2600 ms  la cámara sigue entrando
//   1200–2000 ms  la pantalla se desarma en baldosas
//   1600–2600 ms  aparece el circuito de la placa madre
type V3 = readonly [number, number, number]

export const DURACION_ENTRADA = 2600
export const CAMARA_FRENTE: V3 = [0.3, 1.25, 3.9]
export const MIRA_FRENTE: V3 = [0.3, 0.55, 0]
// a esta distancia la pantalla (0,88 de alto) llena justo la vista con fov 35
export const CAMARA_PANTALLA: V3 = [0, 0.82, 1.35]
export const MIRA_PANTALLA: V3 = [0, 0.82, -0.07]
// y después sigue entrando mientras la pantalla se desarma y aparece el circuito
export const CAMARA_ADENTRO: V3 = [0, 0.82, 0.6]

const recortar = (x: number) => Math.min(1, Math.max(0, x))
const tramo = (ms: number, desde: number, hasta: number) => recortar((ms - desde) / (hasta - desde))
const suave = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const mezclar = (a: V3, b: V3, k: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k,
]

export function momentoEntrada(ms: number) {
  const viaje = suave(tramo(ms, 0, 1200))
  const adentro = suave(tramo(ms, 1200, DURACION_ENTRADA))
  return {
    camara: ms < 1200 ? mezclar(CAMARA_FRENTE, CAMARA_PANTALLA, viaje) : mezclar(CAMARA_PANTALLA, CAMARA_ADENTRO, adentro),
    mira: mezclar(MIRA_FRENTE, MIRA_PANTALLA, viaje),
    desarme: tramo(ms, 1200, 2000),
    circuito: tramo(ms, 1600, DURACION_ENTRADA),
    listo: ms >= DURACION_ENTRADA,
  }
}
