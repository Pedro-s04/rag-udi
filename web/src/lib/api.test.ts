import { afterEach, expect, test, vi } from 'vitest'
import { juegos } from './api'

afterEach(() => vi.unstubAllGlobals())

test('juegos() pide /api/juegos una sola vez aunque lo usen el hero y los destacados', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify([{ appid: 1 }])))
  vi.stubGlobal('fetch', fetch)
  const [a, b] = await Promise.all([juegos(), juegos()])
  expect(a).toEqual([{ appid: 1 }])
  expect(b).toBe(a)
  expect(fetch).toHaveBeenCalledOnce()
})
