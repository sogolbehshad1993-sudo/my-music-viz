// Mood board storage: memory/moodboard/board.json plus media files in memory/moodboard/media/.
import fs from 'node:fs'
import path from 'node:path'

export const DIR = 'memory/moodboard'
const FILE = `${DIR}/board.json`
export const kinds = ['link', 'video', 'image', 'sketch', 'text', 'asset', 'shader', 'color', 'audio'] as const

export type Item = {
  id: string
  kind: (typeof kinds)[number]
  title: string
  source: string // URL, a path under memory/moodboard/media/, or the text itself
  description: string
  tags: string[]
  added: string
  deprecated: null | { date: string; reason: string }
  usedIn: string[] // scene names
}

export const today = () => new Date().toISOString().slice(0, 10)
export const load = (): Item[] => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')).items : [])
export const save = (items: Item[]) => fs.writeFileSync(FILE, JSON.stringify({ items }, null, 2) + '\n')
export const nextId = (items: Item[]) => `m${items.reduce((n, i) => Math.max(n, Number(i.id.slice(1))), 0) + 1}`

export function find(items: Item[], id: string) {
  const item = items.find((i) => i.id === id)
  if (!item) throw new Error(`No item ${id}. Try: npm run -s mood -- list --all`)
  return item
}

// Local files are copied into the board so they are committed with it.
export function storeMedia(id: string, source: string) {
  if (/^https?:\/\//.test(source) || !fs.existsSync(source)) return source
  const mb = fs.statSync(source).size / 1e6
  if (mb > 10) throw new Error(`${source} is ${mb.toFixed(0)} MB. Keep large media outside git and add it as a link.`)
  const target = `${DIR}/media/${id}-${path.basename(source).replace(/[^\w.-]/g, '_')}`
  fs.copyFileSync(source, target)
  return target
}

export const line = (i: Item) =>
  [i.id.padEnd(4), i.kind.padEnd(6), i.added, i.title, i.tags.map((t) => `#${t}`).join(' '), i.usedIn.length ? `[used: ${i.usedIn.join(', ')}]` : '', i.deprecated ? '(deprecated)' : '']
    .filter(Boolean)
    .join('  ')
