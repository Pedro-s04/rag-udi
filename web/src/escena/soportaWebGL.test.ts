import { expect, test } from 'vitest'
import { soportaWebGL } from './soportaWebGL'

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

test('sin document (servidor) → false', () => {
  expect(soportaWebGL(undefined)).toBe(false)
})
