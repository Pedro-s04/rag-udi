import { expect, test } from 'vitest'
import { CAMARA_ADENTRO, CAMARA_FRENTE, CAMARA_PANTALLA, DURACION_ENTRADA, MIRA_FRENTE, MIRA_PANTALLA, momentoEntrada } from './entrada'

const cerca = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 5))

test('al inicio la cámara está de frente y nada se desarmó', () => {
  const m = momentoEntrada(0)
  cerca(m.camara, CAMARA_FRENTE)
  cerca(m.mira, MIRA_FRENTE)
  expect(m.desarme).toBe(0)
  expect(m.circuito).toBe(0)
  expect(m.listo).toBe(false)
})

test('a los 1200 ms la cámara llegó a la pantalla', () => {
  const m = momentoEntrada(1200)
  cerca(m.camara, CAMARA_PANTALLA)
  cerca(m.mira, MIRA_PANTALLA)
  expect(m.desarme).toBe(0)
})

test('mientras se desarma, la cámara sigue entrando hasta adentro', () => {
  expect(momentoEntrada(1900).camara[2]).toBeLessThan(CAMARA_PANTALLA[2])
  cerca(momentoEntrada(DURACION_ENTRADA).camara, CAMARA_ADENTRO)
  cerca(momentoEntrada(DURACION_ENTRADA).mira, MIRA_PANTALLA)
})

test('a los 2000 ms la pantalla está desarmada del todo', () => {
  expect(momentoEntrada(2000).desarme).toBe(1)
})

test('el circuito aparece entre 1600 y 2600 ms', () => {
  expect(momentoEntrada(1600).circuito).toBe(0)
  expect(momentoEntrada(2100).circuito).toBeCloseTo(0.5)
  expect(momentoEntrada(DURACION_ENTRADA).circuito).toBe(1)
})

test('después del final queda listo', () => {
  const m = momentoEntrada(9999)
  expect(m.listo).toBe(true)
  expect(m.circuito).toBe(1)
  expect(DURACION_ENTRADA).toBe(2600)
})

test('tiempos negativos se recortan al inicio', () => {
  expect(momentoEntrada(-5)).toEqual(momentoEntrada(0))
})
