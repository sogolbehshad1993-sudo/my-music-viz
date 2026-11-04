// ctx.input('energy') -> a 0..1 uniform fed by a source picked in the "inputs" panel:
//   slider    mock it by hand            lfo       sine wave at `rate` Hz
//   noise     smooth random at `rate`    mic       level or low / mid / high band, times `gain`
//   midi      a CC number (0..127)       external  curl -s 'localhost:5280/__input?energy=0.8'
// Scenes only see the uniform, so a mock can become a real source without code changes.
import { uniform } from 'three/tsl'
import type { UniformNode } from 'three/webgpu'
import type GUI from 'lil-gui'
import { external } from './bridge.ts'
import { bands, micBand, midiCC, type Band } from './devices.ts'
import { remember } from './ui.ts'
import { remembered } from './store.ts'

export const sources = ['slider', 'lfo', 'noise', 'mic', 'midi', 'external'] as const
type State = { source: (typeof sources)[number]; value: number; rate: number; cc: number; band: Band; gain: number }
export type InputOptions = Partial<State>

const noise = (x: number) => {
  const hash = (i: number) => ((Math.sin(i * 127.1) * 43758.5453) % 1 + 1) % 1
  const i = Math.floor(x)
  const f = x - i
  return hash(i) + (hash(i + 1) - hash(i)) * f * f * (3 - 2 * f)
}

const read: Record<State['source'], (s: State, t: number, name: string) => number> = {
  slider: (s) => s.value,
  lfo: (s, t) => 0.5 + 0.5 * Math.sin(t * s.rate * Math.PI * 2),
  noise: (s, t, name) => noise(t * s.rate * 4 + name.length * 17),
  mic: (s) => Math.min(1, micBand(s.band) * s.gain),
  midi: (s) => midiCC(s.cc),
  external: (s, _t, name) => Math.min(1, Math.max(0, external[name] ?? s.value)),
}

export function createInputs(gui: GUI, changed: () => void) {
  let folder: GUI | undefined
  const list: { name: string; u: UniformNode<'float'>; s: State }[] = []

  function input(name: string, options: InputOptions = {}) {
    folder ??= remember(gui.addFolder('inputs'), 'inputs')
    const defaults: State = { source: 'slider', value: 0, rate: 0.25, cc: list.length + 1, band: 'level', gain: 4, ...options }
    const memo = remembered(`input:${name}`, defaults)
    const s: State = { ...((memo.prior as State) ?? defaults) }
    const save = () => (memo.save(s), changed())

    const f = remember(folder.addFolder(name), `input:${name}`)
    const source = f.add(s, 'source', sources)
    const rows = {
      rate: f.add(s, 'rate', 0.01, 4, 0.01).name('rate Hz').onChange(save),
      cc: f.add(s, 'cc', 0, 127, 1).name('midi cc').onChange(save),
      band: f.add(s, 'band', Object.keys(bands)).onChange(save),
      gain: f.add(s, 'gain', 0, 20, 0.1).onChange(save),
    }
    f.add(s, 'value', 0, 1, 0.001).listen().onChange(save)
    const show = () => {
      rows.rate.show(s.source === 'lfo' || s.source === 'noise')
      rows.cc.show(s.source === 'midi')
      rows.band.show(s.source === 'mic')
      rows.gain.show(s.source === 'mic')
    }
    source.onChange(() => (show(), save()))
    show()

    const u = uniform(s.value)
    list.push({ name, u, s })
    return u
  }

  function update(t: number) {
    for (const { name, u, s } of list) u.value = s.value = read[s.source](s, t, name)
  }

  const values = () => Object.fromEntries(list.map(({ name, s }) => [name, { source: s.source, value: +s.value.toFixed(3) }]))
  return { input, update, values }
}
