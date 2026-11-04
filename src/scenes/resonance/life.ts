// The life of the lines: each knob gives its emotion a number of line slots; each slot is born, grows, holds and fades, then is born again.
// Births are spaced evenly (her rule: a steady flow). Each line is born from 5 of the body's own grains in that emotion's place.
import type { Body } from './data.ts'
import { E, lenOf, nLines, type Emotion } from './emotions.ts'
import { boom, ease, fract, type V } from './math.ts'
import type { Kind, Model } from './lines/kind.ts'
import { Wonder, Fear } from './lines/wonder-fear.ts'
import { Desire, Disgust } from './lines/desire-disgust.ts'
import { Sorrow, Anger } from './lines/sorrow-anger.ts'
import { Love } from './lines/love.ts'
import { makeJoy } from './lines/joy.ts'

export const DELAY = 3.5 // seconds of birth before the line leaves
export type LineData = { L: number; src: V; model: Model; pins: number[] }
export type Birth = { e: Emotion; d: LineData; tau: number }
export type Live = { e: Emotion; d: LineData; reach: number; fade: number; m: number }

export function makeLife(B: Body) {
  const Joy = makeJoy(B.cont)
  const KIND: Record<string, Kind> = { Wonder, Fear, Desire, Disgust, Sorrow, Anger, Love, Joy }
  const all = Array.from({ length: B.n }, (_, i) => i)

  // somewhere new inside the emotion's place (her rule: the WHOLE area makes lines)
  function sourceOf(e: Emotion, slot: number, L: number): V {
    if (e.n === 'Anger') { const k = slot % 5; return k === 1 ? [-0.128, -0.04, 0] : k === 2 ? [0.13, -0.04, 0] : [0, 0.392, 0.036] } // forehead, then each fist
    const os = B.org[e.n], o = os[Math.floor(fract(L * 0.381966) * os.length)]
    const a = 6.2832 * fract(L * 0.618034), r = Math.sqrt(fract(L * 0.7548777))
    return [o.c[0] + r * o.r[0] * 0.9 * Math.cos(a), o.c[1] + r * o.r[1] * 0.9 * Math.sin(a), o.c[2]]
  }
  // the 5 real grains round the start: a small star, so you see them travel in
  function birthPins(e: Emotion, src: V, L: number) {
    const R = B.region[e.n]?.length ? B.region[e.n] : all, out: number[] = []
    for (let q = 0; q < 5; q++) {
      const a = 6.2832 * (q / 5 + fract(L * 0.381966)), tx = src[0] + 0.024 * Math.cos(a), ty = src[1] + 0.024 * Math.sin(a)
      let best = -1, bd = 1e9
      for (const j of R) { const d = Math.hypot(B.pos[3 * j] - tx, B.pos[3 * j + 1] - ty); if (d < bd && !out.includes(j)) { bd = d; best = j } }
      out.push(best)
    }
    return out
  }
  const cache = new Map<string, LineData>()
  function lineData(e: Emotion, slot: number, cyc: number): LineData {
    const key = e.n + slot + ':' + cyc, hit = cache.get(key)
    if (hit) return hit
    const L = slot + 1 + (cyc % 97) * 37
    let src: V, model: Model
    if (e.n === 'Joy') { model = Joy.build(slot, L, [0, 0, 0]); const b0 = Joy.bodyPos(model, 0); src = [b0[0], b0[1], 0.02] } // Joy starts on the outline
    else { src = sourceOf(e, slot, L); model = KIND[e.n].build(slot, L, src) }
    const d = { L, src, model, pins: birthPins(e, src, L) }
    if (cache.size > 400) cache.clear()
    cache.set(key, d)
    return d
  }

  /** ts: slow life time; tSim: real time; music 0..1. hide[j] > 0 for grains that are away being a line */
  function step(ts: number, tSim: number, music: number, hide: Float32Array) {
    const births: Birth[] = [], lines: Live[] = [], LIT = E.map(() => 0), MUS = E.map(() => 0)
    E.forEach((e, i) => {
      const n = nLines(e), m = music * (0.65 + 0.35 * Math.sin(tSim * 2.1 + e.eo * 20))
      MUS[i] = n > 0 ? m : 0
      for (let slot = 0; slot < n; slot++) {
        const T = e.life(slot), off = (((slot / Math.max(e.cap / 5, 1)) + e.eo) % 1) * T
        const tau = (ts + off) % T, d = lineData(e, slot, Math.floor((ts + off) / T))
        const gone = ease((tau - 0.35) / 0.1) * (1 - ease((tau - 5.5) / 2.5))
        for (const j of d.pins) if (j >= 0) hide[j] = Math.max(hide[j], gone)
        LIT[i] = Math.max(LIT[i], ease(tau / 0.5) * (1 - ease((tau - DELAY - 0.5) / 2))) // the place lights up while it gives birth
        if (tau < DELAY) births.push({ e, d, tau })
        else lines.push // Anger bursts out (boom), the rest grow gently
          ({ e, d, m, reach: Math.min((e.burst ? boom : ease)((tau - DELAY) / e.G), lenOf(e)), fade: 1 - ease((tau - (T - 3)) / 3) })
      }
    })
    return { births, lines, LIT, MUS }
  }
  return { step, KIND }
}
