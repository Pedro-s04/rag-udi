// La conversación con Pixel: una sola, la comparten el chat de arriba y el de adentro de la PC.
import type { Filtros, Pasos } from './api'

export type Mensaje = { id: string; quien: 'usuario' | 'pixel'; texto: string; error?: boolean }

export type Estado = {
  mensajes: Mensaje[]
  pasos: Pasos | null
  respuesta: { texto: string; ms: number } | null
  fase: 'libre' | 'buscando' | 'respondiendo'
}

export type Accion =
  | { tipo: 'preguntar'; pregunta: string }
  | { tipo: 'pasos'; pasos: Pasos }
  | { tipo: 'respuesta'; texto: string; ms: number }
  | { tipo: 'error'; mensaje: string }

export type Etapa = 'reescribir' | 'busqueda' | 'respuesta'

export const NO_LO_ENCUENTRO = 'No lo encuentro en los documentos.'

let contador = 0
const nuevoId = () => `m${++contador}`

export const estadoInicial: Estado = {
  mensajes: [{ id: 'm0', quien: 'pixel', texto: 'Hola, soy Pixel. ¿Qué tenés ganas de jugar? Contame y busco en las ofertas de Steam.' }],
  pasos: null,
  respuesta: null,
  fase: 'libre',
}

export function reducir(e: Estado, a: Accion): Estado {
  switch (a.tipo) {
    case 'preguntar':
      return { ...e, mensajes: [...e.mensajes, { id: nuevoId(), quien: 'usuario', texto: a.pregunta }],
               pasos: null, respuesta: null, fase: 'buscando' }
    case 'pasos':
      return { ...e, pasos: a.pasos, fase: 'respondiendo' }
    case 'respuesta':
      return { ...e, mensajes: [...e.mensajes, { id: nuevoId(), quien: 'pixel', texto: a.texto }],
               respuesta: { texto: a.texto, ms: a.ms }, fase: 'libre' }
    case 'error':
      return { ...e, mensajes: [...e.mensajes, { id: nuevoId(), quien: 'pixel', texto: a.mensaje, error: true }],
               fase: 'libre' }
  }
}

// La pieza de la PC que está trabajando. "reescribir" no se distingue en el servidor:
// la escena lo muestra como primer tramo de "busqueda".
export function etapaActiva(e: Estado): Etapa | null {
  if (e.fase === 'buscando') return 'busqueda'
  if (e.fase === 'respondiendo') return 'respuesta'
  return null
}

type Api = {
  buscar: (pregunta: string, filtros: Filtros) => Promise<Pasos>
  responder: (idPrompt: string) => Promise<{ respuesta: string; ms: number }>
}

// Una pregunta completa: buscar → (si hay fragmentos) responder. Nunca deja la fase colgada.
export async function orquestar(pregunta: string, filtros: Filtros, dispatch: (a: Accion) => void, api: Api) {
  dispatch({ tipo: 'preguntar', pregunta })
  try {
    const pasos = await api.buscar(pregunta, filtros)
    dispatch({ tipo: 'pasos', pasos })
    if (!pasos.idPrompt) return dispatch({ tipo: 'respuesta', texto: NO_LO_ENCUENTRO, ms: 0 })
    const { respuesta, ms } = await api.responder(pasos.idPrompt)
    dispatch({ tipo: 'respuesta', texto: respuesta, ms })
  } catch (e) {
    dispatch({ tipo: 'error', mensaje: e instanceof Error ? e.message : String(e) })
  }
}
