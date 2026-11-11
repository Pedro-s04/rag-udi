import { expect, test, vi } from 'vitest'
import { hayWebGL, soportaWebGL } from './soportaWebGL'

const documentoCon = (contexto: unknown) =>
  ({ createElement: () => ({ getContext: () => contexto }) }) as unknown as Document

test('sin contexto WebGL → false', () => {
  expect(soportaWebGL(documentoCon(null))).toBe(false)
})

test('con contexto WebGL → true', () => {
  expect(soportaWebGL(documentoCon({}))).toBe(true)
})

test('si getContext tira error → false', () => {
  const doc = { createElement: () => ({ getContext: () => { throw new Error('bloqueado') } }) } as unknown as Document
  expect(soportaWebGL(doc)).toBe(false)
})

test('libera el contexto de prueba (Chrome permite ~16 vivos)', () => {
  const loseContext = vi.fn()
  const doc = documentoCon({ getExtension: () => ({ loseContext }) })
  soportaWebGL(doc)
  expect(loseContext).toHaveBeenCalledOnce()
})

test('hayWebGL prueba una sola vez y recuerda el resultado', () => {
  const probar = vi.fn(() => true)
  expect(hayWebGL(probar)).toBe(true)
  expect(hayWebGL(probar)).toBe(true)
  expect(probar).toHaveBeenCalledOnce()
})

test('sin document (servidor) → false', () => {
  expect(soportaWebGL(undefined)).toBe(false)
})
