// The eight emotions: line colours from her resonance-Love.32 lines, place colours from palette B (her colour sheet, Sorrow cobalt).
import { clamp, hash, hex, lum, type V } from './math.ts'

export type Emotion = {
  n: string
  col: V // the line colour (Love.32)
  light: V // the line's light tone, near its head
  place: V // the body place colour (palette B)
  cap: number // the knob value above which no more lines are added
  G: number // seconds a line takes to grow
  life: (slot: number) => number // seconds from birth to gone
  short?: number
  floor?: number
  burst?: boolean
  glow: number // lifts dark line colours
  pglow: number // lifts dark place colours (cobalt)
  eo: number
  knob: number
}

const life30 = (s: number) => Math.floor((120 + 60 * hash(s + 41.5)) * 0.3)
const life26 = (s: number) => 26 + 6 * hash(s + 41.5)

type Row = Omit<Emotion, 'glow' | 'pglow' | 'eo' | 'knob' | 'place'> & { placeHex: string }
const ROWS: Row[] = [
  { n: 'Love', col: [1.0, 0.27, 0.85], light: [1.0, 0.65, 0.93], placeHex: '#FF45D8', cap: 30, G: 20, life: life30 },
  { n: 'Desire', col: [1.0, 0.53, 0.01], light: [1.0, 0.68, 0.4], placeHex: '#FE8602', cap: 15, G: 20, life: life26, short: 0.8 },
  { n: 'Wonder', col: [0.03, 0.98, 1.0], light: [0.62, 1.0, 1.0], placeHex: '#07DCE1', cap: 25, G: 20, life: life26 },
  { n: 'Joy', col: [0.89, 1.0, 0.0], light: [0.7, 1.0, 0.45], placeHex: '#D9F124', cap: 15, G: 20, life: life30 },
  { n: 'Sorrow', col: [0.0, 0.62, 1.0], light: [0.62, 0.8, 1.0], placeHex: '#0047AB', cap: 30, G: 18, life: life26, floor: 0.35 },
  { n: 'Anger', col: [1.0, 0.2, 0.36], light: [1.0, 0.62, 0.7], placeHex: '#FD325C', cap: 30, G: 1.6, life: () => 36, burst: true },
  { n: 'Fear', col: [0.46, 0.47, 1.0], light: [0.7, 0.62, 1.0], placeHex: '#7577FC', cap: 25, G: 15, life: life26 },
  { n: 'Disgust', col: [0.11, 1.0, 0.57], light: [0.55, 1.0, 0.62], placeHex: '#18DD7D', cap: 15, G: 14, life: life26 },
]

export const E: Emotion[] = ROWS.map(({ placeHex, ...r }, i) => ({
  ...r,
  place: hex(placeHex),
  glow: clamp(0.6 / Math.max(lum(r.col), 1e-3), 1, 2.5), // dark colours are lifted so they still read on black
  pglow: Math.min(clamp(0.6 / Math.max(lum(hex(placeHex)), 1e-3), 1, 2.5), 1.9),
  eo: i * 0.125,
  knob: 0,
}))
export const EM: Record<string, Emotion> = Object.fromEntries(E.map((e) => [e.n, e]))
export const WHITE: V = [0.95, 0.95, 0.98]

/** HER KNOB RULE (28 Sep deck): the knob value sets how many lines this emotion draws. */
export function nLines(e: Emotion): number {
  // TODO(human)
  return 0
}

/** how far a line may reach along its path, 0..1 (a low knob gives short lines) */
export const lenOf = (e: Emotion) => (e.short || 1) * ((e.floor || 0.1) + (1 - (e.floor || 0.1)) * clamp(e.knob / 100, 0, 1))
