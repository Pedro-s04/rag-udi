import { describe, expect, test, vi } from 'vitest'
import { estadoInicial, etapaActiva, orquestar, reducir, type Accion } from './conversacion'
import type { Pasos } from './api'

const pasos = (idPrompt: string | null): Pasos => ({
  reescritura: { consulta: 'terror coop', ms: 10 },
  vector: [0.1], dimensiones: 1024, msEmbedding: 5,
  filtros: {}, umbral: 0, resultados: [], msBusqueda: 3,
  prompt: idPrompt ? 'PROMPT' : null, idPrompt,
})

describe('reducir', () => {
  test('preguntar agrega el mensaje del usuario y pasa a buscando', () => {
    const conPasos = { ...estadoInicial, pasos: pasos('a'), respuesta: { texto: 'r', ms: 1 } }
    const e = reducir(conPasos, { tipo: 'preguntar', pregunta: 'hola' })
    expect(e.mensajes.at(-1)).toMatchObject({ quien: 'usuario', texto: 'hola' })
    expect(e.fase).toBe('buscando')
    expect(e.pasos).toBeNull()
    expect(e.respuesta).toBeNull()
  })

  test('pasos guarda los pasos y pasa a respondiendo', () => {
    const e = reducir({ ...estadoInicial, fase: 'buscando' }, { tipo: 'pasos', pasos: pasos('a') })
    expect(e.pasos?.idPrompt).toBe('a')
    expect(e.fase).toBe('respondiendo')
  })

  test('respuesta agrega el mensaje de Pixel y vuelve a libre', () => {
    const e = reducir({ ...estadoInicial, fase: 'respondiendo' }, { tipo: 'respuesta', texto: 'Te recomiendo X', ms: 900 })
    expect(e.mensajes.at(-1)).toMatchObject({ quien: 'pixel', texto: 'Te recomiendo X' })
    expect(e.respuesta).toEqual({ texto: 'Te recomiendo X', ms: 900 })
    expect(e.fase).toBe('libre')
  })

  test('error agrega un mensaje de error y deja volver a preguntar', () => {
    const e = reducir({ ...estadoInicial, fase: 'buscando' }, { tipo: 'error', mensaje: 'No se puede conectar a la base' })
    expect(e.mensajes.at(-1)).toMatchObject({ quien: 'pixel', texto: 'No se puede conectar a la base', error: true })
    expect(e.fase).toBe('libre')
  })

  test('el estado inicial tiene un saludo de Pixel', () => {
    expect(estadoInicial.mensajes).toHaveLength(1)
    expect(estadoInicial.mensajes[0].quien).toBe('pixel')
    expect(estadoInicial.fase).toBe('libre')
  })
})

test('etapaActiva según la fase', () => {
  expect(etapaActiva({ ...estadoInicial, fase: 'buscando' })).toBe('busqueda')
  expect(etapaActiva({ ...estadoInicial, fase: 'respondiendo' })).toBe('respuesta')
  expect(etapaActiva(estadoInicial)).toBeNull()
})

describe('orquestar', () => {
  const correr = async (api: Parameters<typeof orquestar>[3]) => {
    const acciones: Accion[] = []
    await orquestar('hola', {}, a => acciones.push(a), api)
    return acciones
  }

  test('sin fragmentos útiles contesta "No lo encuentro" sin llamar a responder', async () => {
    const responder = vi.fn()
    const acciones = await correr({ buscar: async () => pasos(null), responder })
    expect(responder).not.toHaveBeenCalled()
    expect(acciones.map(a => a.tipo)).toEqual(['preguntar', 'pasos', 'respuesta'])
    expect(acciones.at(-1)).toMatchObject({ texto: 'No lo encuentro en los documentos.' })
  })

  test('con prompt llama a responder con el id', async () => {
    const responder = vi.fn(async () => ({ respuesta: 'ok', ms: 5 }))
    const acciones = await correr({ buscar: async () => pasos('id-1'), responder })
    expect(responder).toHaveBeenCalledWith('id-1')
    expect(acciones.at(-1)).toEqual({ tipo: 'respuesta', texto: 'ok', ms: 5 })
  })

  test('si buscar falla despacha error', async () => {
    const acciones = await correr({ buscar: async () => { throw new Error('se cayó') }, responder: vi.fn() })
    expect(acciones.at(-1)).toEqual({ tipo: 'error', mensaje: 'se cayó' })
  })
})
