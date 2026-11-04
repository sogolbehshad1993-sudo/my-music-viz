// Page side of the dev bridge (scripts/vite-bridge.ts): console log, live state, and answers to agent requests.
import { grab } from './grab.ts'

const hot = import.meta.hot
let buffer = ''

const format = (value: unknown): string => {
  if (value instanceof Error) return value.stack ?? value.message
  if (typeof value !== 'object' || value === null) return String(value)
  try {
    return JSON.stringify(value).slice(0, 500)
  } catch {
    return String(value)
  }
}

export function log(level: string, ...args: unknown[]) {
  buffer += `${new Date().toTimeString().slice(0, 8)} ${level} ${args.map(format).join(' ')}\n`
}

for (const level of ['log', 'info', 'warn', 'error'] as const) {
  const original = console[level].bind(console)
  console[level] = (...args: unknown[]) => {
    original(...args)
    if (!String(args[0]).startsWith('[vite]')) log(level, ...args)
  }
}
addEventListener('error', (e) => log('error', e.message, `${e.filename}:${e.lineno}`))
addEventListener('unhandledrejection', (e) => log('error', 'unhandled', e.reason))
setInterval(() => {
  if (buffer && hot) hot.send('pg:log', buffer)
  buffer = ''
}, 300)

let stateTimer = 0
export function report(state: () => object) {
  clearTimeout(stateTimer)
  stateTimer = window.setTimeout(() => hot?.send('pg:state', { ...state(), at: new Date().toISOString() }), 300)
}

export function pickScene(name: string) {
  if (hot) hot.send('pg:scene', name)
  else location.search = `?scene=${name}`
}

export const external: Record<string, number> = {}
hot?.on('pg:input', (values: Record<string, number>) => Object.assign(external, values))

// Agent requests (curl localhost:5280/__<what>) arrive as pg:ask and are answered with pg:answer.
type Answer = (reply: (data: string) => void) => void
const answers: Record<string, Answer> = {}
export const onAsk = (what: string, fn: Answer) => (answers[what] = fn)
hot?.on('pg:ask', ({ id, what }: { id: string; what: string }) => answers[what]?.((data) => hot.send('pg:answer', { id, data })))
onAsk('shot', (reply) => grab((copy) => reply(copy.toDataURL('image/jpeg', 0.85)), 800))

const errorBox = Object.assign(document.createElement('div'), { id: 'pg-error' })
document.body.appendChild(errorBox)
export function showError(error: unknown) {
  errorBox.textContent = error ? format(error).split('\n').slice(0, 4).join('\n') : ''
  if (error) log('error', error)
}
