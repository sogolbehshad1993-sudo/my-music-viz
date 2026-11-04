// DESIRE: a spiral, tight in the lower belly, winding out in big rings round the body, then sweeping out.
// DISGUST: a digital staircase flung out of the throat and stomach; pieces slide sideways 8 times a second, a ghost copy, dashes.
import { FL, V2, clamp, fract, hash, herm2, mix, type V } from '../math.ts'
import type { Kind, Model } from './kind.ts'

const spiral = (m: Model, s: number): V => {
  const r = 0.006 + (m.R - 0.006) * Math.pow(s, 0.85), th = m.th0 + m.dir * 6.2832 * m.turns * s
  return [m.c[0] + 0.07 * s * m.dir + r * Math.cos(th), m.c[1] + 0.1 * s + r * Math.sin(th)]
}

export const Desire: Kind = {
  build(_slot, L, SRC) {
    const side = hash(L) > 0.5 ? 1 : -1, big = hash(L + 3), R = 0.14 + 0.46 * big * big + 0.1 * hash(L + 4)
    return {
      L, R,
      c: [SRC[0] + (hash(L + 5) - 0.5) * 0.06, SRC[1] + (hash(L + 6) - 0.3) * 0.08],
      turns: 1.3 + 1.7 * hash(L + 8), dir: hash(L + 9) > 0.4 ? 1 : -1, th0: 6.2832 * hash(L + 10),
      E: [side * (0.55 + 0.4 * hash(L + 11)), -0.3 + 0.62 * hash(L + 12)],
    }
  },
  pos(m, s, tm, mus) {
    const sc = clamp(s, 0, 1), S1 = 0.8
    let p: V
    if (sc <= S1) p = spiral(m, sc / S1)
    else {
      const t = (sc - S1) / (1 - S1), q0 = spiral(m, 1), tg = V2.norm(V2.sub(q0, spiral(m, 0.985))), dl = V2.len(V2.sub(m.E, q0)), te = V2.norm([Math.sign(m.E[0]), -0.45])
      p = herm2(q0, V2.mul(tg, dl * 0.9), m.E, V2.mul(te, dl * 0.8), t)
    }
    p = [p[0] + 0.003 * mus * Math.sin(40 * sc + tm), p[1] + 0.003 * mus * Math.cos(35 * sc + tm)]
    return [clamp(p[0], -0.9, 0.9), clamp(p[1], FL - 0.03, 0.6), 0.05]
  },
}

export const Disgust: Kind = {
  build(_slot, L, SRC) {
    const side = hash(L) > 0.5 ? 1 : -1, y0 = SRC[1] + (hash(L + 4) - 0.5) * 0.3, vert = hash(L + 5) > 0.78, vs = hash(L + 6) > 0.5 ? 1 : -1
    let q: V = [side * 0.012 + SRC[0], y0]
    const A: V[] = []
    for (let k = 0; k < 12; k++) {
      A.push([q[0], q[1], 0])
      const run = 0.05 + 0.11 * hash(L + 10 + k), jump = (0.03 + 0.1 * hash(L + 30 + k)) * (hash(L + 50 + k) > 0.5 ? 1 : -1)
      if (vert) q = V2.add(q, k % 2 === 0 ? [0, vs * run * 1.3] : [side * jump * 1.2, 0])
      else q = V2.add(q, k % 2 === 0 ? [side * run, 0] : [0, jump])
      q = [clamp(q[0], -0.88, 0.88), clamp(q[1], FL, 0.58)]
    }
    return { A, L }
  },
  pos(m, s, tm) {
    const u = clamp(s, 0, 1) * 11, seg = Math.min(Math.floor(u), 10), f = u - seg, a = m.A[seg], b = m.A[seg + 1]
    let x = mix(a[0], b[0], f)
    const y = mix(a[1], b[1], f)
    const st = Math.floor(tm * 8), blk = Math.floor(clamp(s, 0, 0.9999) * 18), hit = hash(m.L + blk * 1.7 + st * 0.31) >= 0.66 ? 1 : 0
    x += (hash(m.L + blk * 3.1 + st * 0.77) - 0.5) * 0.14 * hit * clamp((s - 0.04) * 8, 0, 1)
    return [x, y, 0]
  },
  mask(m, s, tm) {
    const n = 12 + 20 * hash(m.L + 21), duty = 0.4 + 0.3 * hash(m.L + 22), dash = fract(s * n + hash(m.L + 23)) <= duty ? 1 : 0
    const drop = hash(m.L + Math.floor(s * 40) * 2.9 + Math.floor(tm * 10) * 0.71) >= 0.12 ? 1 : 0
    return dash * drop
  },
  ghost(m, s, tm) {
    const big = hash(m.L + Math.floor(s * 18) * 4.3 + Math.floor(tm * 8) * 0.43) >= 0.55 ? 1 : 0
    return [0.004 + 0.012 * big, 0.0015 * big]
  },
}
