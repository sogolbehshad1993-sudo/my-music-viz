// Dev bridge between the open page and the agent. Files land in .playground/ (git-ignored):
//   log.txt      the page's console output and errors
//   state.json   scene, backend, seed, panel values and inputs, as the designer has them
// Endpoints:
//   /__shot      a frame from the open page -> .playground/shot.jpg
//   /__timeline  Theatre keyframes of the scene on screen -> src/scenes/<scene>.timeline.json
//   /__input     external inputs: ?energy=0.8 or POST {"energy":0.8}
import fs from 'node:fs'
import type { Plugin, ViteDevServer } from 'vite'
import type { ServerResponse } from 'node:http'

const DIR = '.playground'
const safeName = (name: string) => /^[\w-]+$/.test(name)

export function bridge(): Plugin {
  return { name: 'playground-bridge', apply: 'serve', configureServer }
}

function configureServer(server: ViteDevServer) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(`${DIR}/log.txt`, '')
  const pending = new Map<string, (data: string) => void>()
  let seq = 0

  // Ask the open page for something and answer the curl request with what was saved.
  function ask(what: string, res: ServerResponse, save: (data: string) => string) {
    const id = String(++seq)
    const timer = setTimeout(() => pending.delete(id) && res.end('No page answered. Is the playground open in a browser?\n'), 3000)
    pending.set(id, (data) => {
      clearTimeout(timer)
      try {
        res.end(`${save(data)}\n`)
      } catch (e) {
        res.end(`${(e as Error).message}\n`)
      }
    })
    server.ws.send('pg:ask', { id, what })
  }

  server.ws.on('pg:answer', ({ id, data }: { id: string; data: string }) => {
    pending.get(id)?.(data)
    pending.delete(id)
  })
  server.ws.on('pg:log', (text: string) => {
    const log = `${DIR}/log.txt`
    if (fs.existsSync(log) && fs.statSync(log).size > 200_000) fs.writeFileSync(log, fs.readFileSync(log, 'utf8').slice(-100_000))
    fs.appendFileSync(log, text)
  })
  server.ws.on('pg:state', (state: object) => fs.writeFileSync(`${DIR}/state.json`, JSON.stringify(state, null, 2)))
  server.ws.on('pg:scene', (name: string) => safeName(name) && fs.writeFileSync('src/current.ts', `export default '${name}'\n`))

  server.middlewares.use('/__shot', (_req, res) =>
    ask('shot', res, (data) => (fs.writeFileSync(`${DIR}/shot.jpg`, Buffer.from(data.split(',')[1], 'base64')), `${DIR}/shot.jpg`)),
  )
  server.middlewares.use('/__timeline', (_req, res) =>
    ask('timeline', res, (data) => {
      const { scene, state, error } = JSON.parse(data)
      if (error || !safeName(scene)) throw new Error(error ?? 'bad scene name')
      const file = `src/scenes/${scene}.timeline.json`
      fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`)
      return file
    }),
  )
  server.middlewares.use('/__input', (req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const values = { ...Object.fromEntries(new URL(req.url ?? '', 'http://x').searchParams), ...(body ? JSON.parse(body) : {}) }
        server.ws.send('pg:input', Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])))
        res.end('ok\n')
      } catch {
        res.end('Send JSON like {"energy":0.8}\n')
      }
    })
  })
}
