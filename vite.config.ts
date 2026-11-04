import { defineConfig } from 'vite'
import { bridge } from './scripts/vite-bridge.ts'

export default defineConfig({
  plugins: [bridge()],
  server: { port: 5280, strictPort: true, open: true },
})
