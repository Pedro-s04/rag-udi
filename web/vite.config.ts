/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// En desarrollo, /api va al servidor del RAG (chat.mjs), en el puerto PUERTO del .env.
const puerto = process.env.PUERTO ?? 3050

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: { proxy: { '/api': `http://127.0.0.1:${puerto}` } },
  test: { environment: 'node' },
})
