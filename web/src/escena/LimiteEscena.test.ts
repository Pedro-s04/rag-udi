import { expect, test, vi } from 'vitest'

test('avisa la falla (así la entrada a la PC no queda colgada en "ENTRANDO…")', () => {
  const onFallo = vi.fn()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  new LimiteEscena({ respaldo: null, children: null, onFallo }).componentDidCatch(new Error('sin GPU'))
  expect(onFallo).toHaveBeenCalledOnce()
})
import { LimiteEscena } from './LimiteEscena'

test('si la escena 3D tira un error, el límite pasa al respaldo en vez de tirar la página', () => {
  expect(LimiteEscena.getDerivedStateFromError()).toEqual({ fallo: true })
})
