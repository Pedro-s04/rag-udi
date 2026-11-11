import { expect, test } from 'vitest'
import type { Destacado } from './api'
import { fuenteDeVideo } from './video'

const juego = (trailer: Destacado['trailer']) => ({ trailer }) as Destacado

test('sin tráiler no hay video', () => {
  expect(fuenteDeVideo(juego(null))).toBeNull()
})

test('tráiler sin URL HLS no hay video', () => {
  expect(fuenteDeVideo(juego({ miniatura: 't', hls: '' }))).toBeNull()
})

test('tráiler con HLS devuelve la URL', () => {
  expect(fuenteDeVideo(juego({ miniatura: 't', hls: 'h' }))).toBe('h')
})
