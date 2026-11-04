// ctx.params({...}): one line declares a value, its TSL uniform and its panel row.
//   speed: 1                 slider 0..1      -> uniform float
//   speed: [1, 0, 5, 0.1]    slider min..max  -> uniform float
//   tint: '#ff3366'          color picker     -> uniform color
//   glow: true               checkbox         -> uniform bool
//   shape: ['orb', 'cube']   dropdown         -> { value: 'orb' }
//   burst: () => {...}       button           -> the function
import { Color, type UniformNode } from 'three/webgpu'
import { uniform } from 'three/tsl'
import type GUI from 'lil-gui'
import type { Controller } from 'lil-gui'
import { remembered } from './store.ts'

export type ParamDef = number | readonly [number, number, number, number?] | string | boolean | readonly string[] | (() => void)

type Out<D> = D extends () => void ? D
  : D extends boolean ? UniformNode<'bool'>
  : D extends string ? UniformNode<'color'>
  : D extends readonly string[] ? { value: D[number] }
  : UniformNode<'float'>

export type Params<T> = { [K in keyof T]: Out<T[K]> }
export type Entry = { def: Exclude<ParamDef, () => void>; node: { value: unknown }; row: Controller }

export function createParams(scene: string, gui: GUI, changed: () => void) {
  const values: Record<string, unknown> = {} // what the designer dialed in, reported to .playground/state.json
  const entries: Record<string, Entry> = {} // for ctx.timeline

  function params<const T extends Record<string, ParamDef>>(defs: T): Params<T> {
    const out: Record<string, unknown> = {}
    for (const [key, def] of Object.entries(defs)) {
      if (typeof def === 'function') {
        gui.add({ [key]: def }, key)
        out[key] = def
        continue
      }
      const memo = remembered(`param:${scene}:${key}`, def)
      values[key] = memo.prior ?? (Array.isArray(def) ? def[0] : def)
      entries[key] = control(gui, key, def, values[key], (v) => {
        values[key] = v
        memo.save(v)
        changed()
      })
      out[key] = entries[key].node
    }
    changed()
    return out as Params<T>
  }
  return Object.assign(params, { values, entries })
}

function control(gui: GUI, key: string, def: Entry['def'], value: unknown, set: (v: unknown) => void): Entry {
  if (typeof def === 'string') {
    const proxy = { [key]: value as string }
    const u = uniform(new Color(proxy[key]))
    const row = gui.addColor(proxy, key).onChange((v: string) => (u.value.set(v), set(v)))
    return { def, node: u, row }
  }
  if (typeof def === 'boolean') {
    const u = uniform(value as boolean)
    return { def, node: u, row: gui.add(u, 'value').name(key).onChange(set) }
  }
  if (typeof def !== 'number' && typeof def[0] === 'string') {
    const o = { value }
    return { def, node: o, row: gui.add(o, 'value', def as string[]).name(key).onChange(set) }
  }
  const [, min, max, step] = typeof def === 'number' ? [def, 0, 1] : (def as readonly number[])
  const u = uniform(value as number)
  return { def, node: u, row: gui.add(u, 'value', min, max, step ?? (max - min) / 1000).name(key).onChange(set) }
}
