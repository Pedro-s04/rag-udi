// Cliente de la API del RAG (chat.mjs + servidor.mjs).

export type Resultado = {
  seccion: string
  fuente: string
  appid: number | null
  similitud: number
  precio: number | null
  descuento: number | null
  util: boolean
}

// Lo que devuelve POST /api/buscar: cada etapa del RAG hasta el prompt.
export type Pasos = {
  reescritura: { consulta: string; ms: number; error?: string }
  vector: number[]
  dimensiones: number
  msEmbedding: number
  filtros: { descuentoMin?: number; precioMax?: number }
  umbral: number
  resultados: Resultado[]
  msBusqueda: number
  prompt: string | null
  idPrompt: string | null
}

export type Destacado = {
  appid: number
  nombre: string
  origen: 'mas-vendido' | 'popular' | 'oferta'
  enCorpus: boolean
  precio: number
  precioOriginal: number
  descuento: number
  gratis: boolean
  generos: string[]
  portada: string
  caja: string | null
  capsula: string
  capturas: string[]
  trailer: { miniatura: string; hls: string } | null
  tienda: string
}

export type Filtros = { precioMax?: number; descuentoMin?: number }

async function pedir<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  const res = await fetch(ruta, cuerpo === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  let datos: (T & { error?: string }) | undefined
  try { datos = await res.json() } catch { /* sin JSON */ }
  if (!datos) throw new Error(`El servidor respondió ${res.status}. ¿Está corriendo npm run chat?`)
  if (datos.error) throw new Error(datos.error)
  return datos
}

export const buscar = (pregunta: string, filtros: Filtros) => pedir<Pasos>('/api/buscar', { pregunta, ...filtros })
export const responder = (idPrompt: string) => pedir<{ respuesta: string; ms: number }>('/api/responder', { idPrompt })
// Los destacados se piden una vez por página: los usan el fondo del hero y la sección de juegos.
// Si falla, se olvida la promesa para poder reintentar.
let juegosPedidos: Promise<Destacado[]> | null = null
export const juegos = () => {
  juegosPedidos ??= pedir<Destacado[]>('/api/juegos').catch(e => { juegosPedidos = null; throw e })
  return juegosPedidos
}
