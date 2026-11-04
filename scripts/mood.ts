// Mood board CLI. Run `npm run -s mood -- help`.
import { parseArgs } from 'node:util'
import { find, kinds, line, load, nextId, save, storeMedia, today, type Item } from './mood/board.ts'

const help = `npm run -s mood -- <command>
  list [--all] [--kind k] [--tag t]       active items, one line each (default command)
  search <words>                          match title, description, tags and source
  show <id>                               everything about one item
  pick [n] [--kind k] [--tag t]           n random active items, for inspiration (default 3)
  add <kind> <url|file|text> --title "..." [--desc "..."] [--tags a,b]
  edit <id> [--title ..] [--desc ..] [--tags a,b]
  use <id> <scene>                        mark an item as used by an experiment
  deprecate <id> [reason]  |  restore <id>
kinds: ${kinds.join(', ')}`

const { values: o, positionals: [cmd = 'list', ...args] } = parseArgs({
  allowPositionals: true,
  options: { all: { type: 'boolean' }, kind: { type: 'string' }, tag: { type: 'string' }, title: { type: 'string' }, desc: { type: 'string' }, tags: { type: 'string' } },
})
const items = load()
const tags = (s?: string) => (s ? s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [])
const filtered = () => items.filter((i) => (o.all || !i.deprecated) && (!o.kind || i.kind === o.kind) && (!o.tag || i.tags.includes(o.tag)))
const print = (list: Item[]) => console.log(list.length ? list.map(line).join('\n') : 'Nothing on the board matches.')

const commands: Record<string, () => void> = {
  help: () => console.log(help),
  list: () => print(filtered()),
  search: () => {
    const words = args.join(' ').toLowerCase().split(/\s+/)
    print(items.filter((i) => words.every((w) => JSON.stringify([i.title, i.description, i.tags, i.source]).toLowerCase().includes(w))))
  },
  show: () => console.log(JSON.stringify(find(items, args[0]), null, 2)),
  pick: () => print(filtered().sort(() => Math.random() - 0.5).slice(0, Number(args[0] ?? 3))),
  add: () => {
    const [kind, source] = args as [Item['kind'], string]
    if (!kinds.includes(kind) || !source || !o.title) throw new Error(help)
    const id = nextId(items)
    const item: Item = { id, kind, title: o.title, source: storeMedia(id, source), description: o.desc ?? '', tags: tags(o.tags), added: today(), deprecated: null, usedIn: [] }
    save([...items, item])
    console.log(`added ${line(item)}`)
  },
  edit: () => {
    const item = find(items, args[0])
    Object.assign(item, { title: o.title ?? item.title, description: o.desc ?? item.description, tags: o.tags ? tags(o.tags) : item.tags })
    save(items)
    console.log(line(item))
  },
  use: () => {
    const item = find(items, args[0])
    if (!item.usedIn.includes(args[1])) item.usedIn.push(args[1])
    save(items)
    console.log(line(item))
  },
  deprecate: () => {
    const item = find(items, args[0])
    item.deprecated = { date: today(), reason: args.slice(1).join(' ') }
    save(items)
    console.log(line(item))
  },
  restore: () => {
    find(items, args[0]).deprecated = null
    save(items)
    console.log(line(find(items, args[0])))
  },
}

try {
  ;(commands[cmd] ?? commands.help)()
} catch (e) {
  console.error((e as Error).message)
  process.exitCode = 1
}
