// ctx.timeline(['warp', 'glow']): keyframe those params in the Theatre.js studio (0.7.2, dev only).
// The studio (outline, props, dope sheet, curve editor) appears over the canvas; while a timeline
// is active, ctx.time follows its playhead. To keep the keys: `curl -s localhost:5280/__timeline`
// writes src/scenes/<scene>.timeline.json, which loads on the next run. Commit it.
import { getProject, types, type IProject } from '@theatre/core'
import { Color, SRGBColorSpace } from 'three/webgpu'
import { onAsk } from './bridge.ts'
import type { Entry } from './params.ts'

const saved = import.meta.glob<object>('../scenes/*.timeline.json', { import: 'default' })
type Studio = typeof import('@theatre/studio').default
const cache = globalThis as { __pgStudio?: Promise<Studio | undefined>; __pgProjects?: Record<string, IProject> }
// Loaded on first use only, once per page (it survives hot reloads).
const studio = () =>
  (cache.__pgStudio ??= import.meta.env.DEV
    ? import('@theatre/studio').then((m) => {
        const s = (m.default as unknown as { default?: Studio }).default ?? m.default // CommonJS interop
        s.initialize()
        return s
      })
    : Promise.resolve(undefined))

let active: string | undefined
onAsk('timeline', async (reply) => {
  const s = await cache.__pgStudio?.catch(() => undefined)
  reply(JSON.stringify(active && s ? { scene: active, state: s.createContentOfSaveFile(active) } : { error: 'The scene on screen has no timeline.' }))
})

function prop({ def, node }: Entry) {
  if (typeof def === 'boolean') return types.boolean(node.value as boolean)
  if (typeof def === 'string') {
    const c = (node.value as Color).getRGB(new Color(), SRGBColorSpace)
    return types.rgba({ r: c.r, g: c.g, b: c.b, a: 1 })
  }
  if (typeof def !== 'number' && typeof def[0] === 'string') return types.stringLiteral(node.value as string, Object.fromEntries((def as string[]).map((o) => [o, o])))
  const [min, max] = typeof def === 'number' ? [0, 1] : (def.slice(1, 3) as number[])
  return types.number(node.value as number, { range: [min, max] })
}

function apply({ def, node }: Entry, v: unknown) {
  if (typeof def === 'string') (node.value as Color).setRGB((v as Color).r, (v as Color).g, (v as Color).b, SRGBColorSpace)
  else node.value = v
}

export async function createTimeline(scene: string, entries: Record<string, Entry>, names: string[], loop?: number) {
  const s = await studio()
  const state = await saved[`../scenes/${scene}.timeline.json`]?.()
  const projects = (cache.__pgProjects ??= {}) // Theatre allows one getProject per id per page
  const project = (projects[scene] ??= getProject(scene, state ? { state } : undefined))
  await project.ready
  const sheet = project.sheet('main')
  const missing = names.filter((n) => !entries[n])
  if (missing.length) throw new Error(`ctx.timeline: declare ${missing.join(', ')} with ctx.params first`)
  const object = sheet.object('params', Object.fromEntries(names.map((n) => [n, prop(entries[n])])), { reconfigure: true })
  const off = object.onValuesChange((values) => names.forEach((n) => (apply(entries[n], values[n]), entries[n].row.updateDisplay())))
  sheet.sequence.play({ iterationCount: Infinity, range: loop ? [0, loop] : undefined })
  active = scene
  s?.ui.restore()
  s?.setSelection([object])
  document.body.classList.add('pg-timeline')
  return {
    position: () => sheet.sequence.position,
    dispose() {
      off()
      sheet.sequence.pause()
      active = undefined
      s?.ui.hide()
      document.body.classList.remove('pg-timeline')
    },
  }
}
