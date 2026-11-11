// La pantalla del monitor (como en rag-diseño): "OFERTAS RAG", Pixel en línea, renglones que
// se escriben y una barra de progreso. Con desarme 0..1 la imagen se parte en baldosas que se
// separan y dejan ver pistas de circuito: es el puente entre la pantalla y la placa madre.
export const ANCHO = 1024
export const ALTO = 576
const RENGLONES = [0.62, 0.38, 0.8, 0.5, 0.7, 0.3, 0.9, 0.45, 0.66, 0.55]
const COLUMNAS = 16
const FILAS = 9

let base: HTMLCanvasElement | null = null

function redondeado(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

function dibujarBase(g: CanvasRenderingContext2D, t: number) {
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, '#10233a'); fondo.addColorStop(1, '#05080c')
  g.fillStyle = fondo; g.fillRect(0, 0, ANCHO, ALTO)
  g.strokeStyle = 'rgba(102,192,244,0.07)'; g.lineWidth = 1
  for (let x = 0; x < ANCHO; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ALTO); g.stroke() }
  for (let y = 0; y < ALTO; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(ANCHO, y); g.stroke() }

  g.textBaseline = 'middle'; g.textAlign = 'left'
  g.font = '700 30px "Chakra Petch", sans-serif'; g.fillStyle = '#66c0f4'; g.fillText('OFERTAS RAG', 40, 44)
  g.fillStyle = '#beee11'; g.beginPath(); g.arc(ANCHO - 220, 44, 7, 0, Math.PI * 2); g.fill()
  g.font = '600 22px Inter, sans-serif'; g.fillStyle = '#c7d5e0'; g.fillText('PIXEL EN LÍNEA', ANCHO - 202, 44)

  // Pixel
  const flota = Math.sin(t * 2) * 4
  g.fillStyle = '#8fa6bc'; g.fillRect(509, 92 + flota, 6, 30)
  g.shadowColor = '#66c0f4'; g.shadowBlur = 20; g.fillStyle = '#66c0f4'
  g.beginPath(); g.arc(512, 88 + flota, 10, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0
  g.fillStyle = '#dbe6f0'; redondeado(g, 402, 120 + flota, 220, 160, 44); g.fill()
  g.fillStyle = '#0e141b'; redondeado(g, 424, 144 + flota, 176, 104, 30); g.fill()
  const parpadeo = t % 4.2 > 4.05 ? 0.12 : 1
  g.fillStyle = '#66c0f4'; g.shadowColor = '#66c0f4'; g.shadowBlur = 24
  g.beginPath(); g.ellipse(476, 196 + flota, 18, 24 * parpadeo, 0, 0, Math.PI * 2); g.fill()
  g.beginPath(); g.ellipse(548, 196 + flota, 18, 24 * parpadeo, 0, 0, Math.PI * 2); g.fill()
  g.shadowBlur = 0

  // renglones que se van escribiendo
  const paso = Math.floor(t * 1.5)
  for (let i = 0; i < 5; i++) {
    const largo = RENGLONES[(i + paso) % RENGLONES.length]
    g.fillStyle = i === 0 ? 'rgba(102,192,244,0.85)' : 'rgba(47,74,104,0.95)'
    redondeado(g, 120, 330 + i * 34, 700 * largo, 14, 7); g.fill()
  }
  if (Math.floor(t * 2) % 2 === 0) {
    g.fillStyle = '#beee11'; g.fillRect(120 + 700 * RENGLONES[paso % RENGLONES.length] + 12, 329, 10, 16)
  }
  g.fillStyle = 'rgba(47,74,104,0.8)'; redondeado(g, 120, 512, 784, 10, 5); g.fill()
  g.fillStyle = '#beee11'; redondeado(g, 120, 512, Math.max(12, 784 * ((t * 0.18) % 1)), 10, 5); g.fill()

  // barrido de escaneo
  const sy = (t * 120) % ALTO
  const barrido = g.createLinearGradient(0, sy - 30, 0, sy + 30)
  barrido.addColorStop(0, 'rgba(102,192,244,0)'); barrido.addColorStop(0.5, 'rgba(102,192,244,0.12)'); barrido.addColorStop(1, 'rgba(102,192,244,0)')
  g.fillStyle = barrido; g.fillRect(0, sy - 30, ANCHO, 60)
}

// Pistas de circuito que aparecen entre las baldosas.
function dibujarPistas(g: CanvasRenderingContext2D, t: number, intensidad: number) {
  g.fillStyle = '#04110a'; g.fillRect(0, 0, ANCHO, ALTO)
  g.lineWidth = 3
  for (let i = 0; i < 14; i++) {
    const y = 20 + i * 40
    g.strokeStyle = `rgba(190,238,17,${0.25 * intensidad})`
    g.beginPath(); g.moveTo(0, y); g.lineTo(300 + (i % 4) * 90, y); g.lineTo(340 + (i % 4) * 90, y + 20); g.lineTo(ANCHO, y + 20); g.stroke()
    const x = ((t * 400 + i * 173) % (ANCHO + 200)) - 100
    g.fillStyle = `rgba(102,192,244,${intensidad})`
    g.beginPath(); g.arc(x, x < 320 + (i % 4) * 90 ? y : y + 20, 4, 0, Math.PI * 2); g.fill()
  }
}

export function dibujarPantalla(g: CanvasRenderingContext2D, t: number, desarme: number): void {
  if (desarme <= 0) { dibujarBase(g, t); return }
  base ??= Object.assign(document.createElement('canvas'), { width: ANCHO, height: ALTO })
  const b = base.getContext('2d')!
  dibujarBase(b, t)
  dibujarPistas(g, t, desarme)
  const w = ANCHO / COLUMNAS, h = ALTO / FILAS
  for (let c = 0; c < COLUMNAS; c++) {
    for (let f = 0; f < FILAS; f++) {
      // cada baldosa arranca un poco más tarde según su distancia al centro
      const dx = (c + 0.5) / COLUMNAS - 0.5, dy = (f + 0.5) / FILAS - 0.5
      const demora = Math.hypot(dx, dy) * 0.9
      const p = Math.min(1, Math.max(0, (desarme - demora * 0.5) / 0.6))
      if (p >= 1) continue
      const escala = 1 - p
      const ox = dx * p * 260, oy = dy * p * 260
      g.globalAlpha = 1 - p * p
      g.drawImage(base, c * w, f * h, w, h,
        c * w + ox + (w * (1 - escala)) / 2, f * h + oy + (h * (1 - escala)) / 2, w * escala, h * escala)
    }
  }
  g.globalAlpha = 1
}
