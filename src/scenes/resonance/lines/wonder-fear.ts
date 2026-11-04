// WONDER: a fan of thin rays out of the crown, rising, then bending outwards like hair.
// FEAR: stressed, interrupted lines out of the chest: most go up over the shoulders, some down to the floor; pieces shiver in bursts.
import { FL, JIT, V2, clamp, hash, spline12, type V } from '../math.ts'
import type { Kind } from './kind.ts'

export const Wonder: Kind = {
  build(_slot, L, SRC) {
    const side = hash(L) > 0.5 ? 1 : -1, a0 = 1.5708 + side * (0.1 + 0.7 * hash(L + 5)), tot = 0.35 + 0.95 * hash(L + 6), len = 0.55 + 0.55 * hash(L + 7)
    let q: V = [SRC[0] + side * 0.012 * hash(L + 8), SRC[1] + 0.005]
    let top = q[1]
    const A: V[] = []
    for (let k = 0; k < 12; k++) {
      const f = k / 11, a = a0 - side * tot * Math.pow(f, 1.4)
      A.push([q[0], q[1], 0]); top = Math.max(top, q[1])
      q = V2.add(q, V2.mul([Math.cos(a), Math.sin(a)], (len / 11) * (k === 0 ? 0.5 : 1)))
    }
    const y0 = SRC[1] + 0.005, room = 0.68 - y0, used = top - y0 // never cut flat at the top
    if (used > room) { const sq = room / used; A.forEach((p) => (p[1] = y0 + (p[1] - y0) * sq)) }
    return { A, L }
  },
  pos(m, s, tm, mus) {
    const p = spline12(m.A, s), ph = hash(m.L + 3) * 6.2832, w = clamp((s - 0.2) * 4, 0, 1), amp = 0.004 + 0.006 * hash(m.L + 57) + 0.03 * mus
    return [p[0] + w * amp * Math.sin(2.5 * s + ph + tm * 0.5), p[1] + w * amp * Math.cos(2 * s + ph * 1.3 + tm * 0.5), 0]
  },
}

export const Fear: Kind = {
  build(_slot, L, SRC) {
    const side = hash(L) > 0.5 ? 1 : -1, kind = hash(L + 50), A: V[] = []
    const P = (x: number, y: number) => A.push([x, y, 0])
    for (let k = 0; k < 3; k++) P(SRC[0] + side * 0.006 * k, SRC[1] + 0.012 * k)
    if (kind < 0.62) {
      const ex = 0.3 + 0.4 * hash(L + 30), ey = 0.32 + 0.28 * hash(L + 31)
      P(side * 0.03 + JIT(L, 0, 0.03), 0.3); P(side * 0.06 + JIT(L, 1, 0.04), 0.37); P(side * 0.1 + JIT(L, 2, 0.05), 0.43 + JIT(L, 3, 0.04))
      P(side * 0.18 + JIT(L, 4, 0.06), 0.5 + JIT(L, 5, 0.06)); P(side * 0.28 + JIT(L, 6, 0.07), 0.46 + JIT(L, 7, 0.07))
      P(side * 0.5 * (ex + 0.28) + JIT(L, 8, 0.08), 0.5 * (ey + 0.46) + JIT(L, 9, 0.08))
      P(side * 0.8 * ex + JIT(L, 10, 0.08), ey + 0.06 + JIT(L, 11, 0.08)); P(side * ex + JIT(L, 12, 0.06), ey + JIT(L, 13, 0.08))
      P(side * (ex + 0.06) + JIT(L, 14, 0.05), ey - 0.04 + JIT(L, 15, 0.08))
    } else {
      const ex = 0.2 + 0.34 * hash(L + 32)
      P(side * 0.03 + JIT(L, 0, 0.03), 0.12); P(side * 0.05 + JIT(L, 1, 0.04), 0.02); P(side * 0.06 + JIT(L, 2, 0.05), -0.1); P(side * 0.06 + JIT(L, 3, 0.05), -0.22)
      P(side * 0.07 + JIT(L, 4, 0.04), -0.34); P(side * 0.1 + JIT(L, 5, 0.04), FL + 0.02); P(side * 0.5 * ex + JIT(L, 6, 0.06), FL + JIT(L, 7, 0.03))
      P(side * ex + JIT(L, 8, 0.06), FL + 0.03 + JIT(L, 9, 0.04)); P(side * (ex + 0.12) + JIT(L, 10, 0.06), FL + 0.1 * hash(L + 33) + JIT(L, 11, 0.04))
    }
    return { A, L }
  },
  pos(m, s, tm, mus) {
    const L = m.L, p = spline12(m.A, s), ph = hash(L + 3) * 6.2832, w = clamp((s - 0.04) * 8, 0, 1), st = Math.floor(tm * 5), blk = Math.floor(clamp(s, 0, 0.9999) * 16)
    const hit = hash(L + blk * 2.2 + st * 0.13) >= 0.42 ? 1 : 0, jx = (hash(L + blk * 7.1 + st * 0.37) - 0.5) * 0.042 * hit, jy = (hash(L + blk * 5.3 + st * 0.91) - 0.5) * 0.042 * hit
    const burst = 0.6 + 1.6 * (hash(L + Math.floor(tm * 7) * 1.7) >= 0.72 ? 1 : 0), amp = (0.0035 + 0.0035 * hash(L + 57) + 0.012 * mus) * burst
    return [
      p[0] + w * jx + w * (amp * Math.sin(95 * s + ph + tm * 38) + 0.6 * amp * Math.sin(41 * s + tm * 23)),
      p[1] + w * jy + w * (amp * Math.cos(83 * s + ph * 1.7 + tm * 31) + 0.6 * amp * Math.cos(37 * s + tm * 19)),
      0,
    ]
  },
  mask: (m, s, tm) => (hash(m.L + Math.floor(s * 22) * 3.7 + Math.floor(tm * 4) * 0.53) >= 0.22 ? 1 : 0), // pieces drop out and come back
}
