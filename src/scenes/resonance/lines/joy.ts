// JOY: no spot of its own. It runs along the outline of the body, then the pen walks out into big swaying loops.
import { V2, catmull, clamp, ease, fract, hash, mix, softClamp, type V } from '../math.ts'
import type { Kind, Model } from './kind.ts'

const PERIM = 4.1706, KST = 96, LOOPW = 0.38, LOOPDRIFT = 0.5, SWAY = 0.3
const gprof = (x: number) => { x = clamp(x, 0, 1); return 0.5 * x + 0.5 * ease(x) }
const wrapA = (a: number) => (((a + Math.PI) % 6.28318531) + 6.28318531) % 6.28318531 - Math.PI

export function makeJoy(CONT: V[]): Kind & { bodyPos(J: Model, u: number): V } {
  const N = CONT.length
  const contourAt = (u: number) => {
    const x = fract(u) * N, i = Math.floor(x) % N
    return catmull(CONT[(i + N - 1) % N], CONT[i], CONT[(i + 1) % N], CONT[(i + 2) % N], x - Math.floor(x))
  }
  const bodyPos = (J: Model, u: number): V => {
    const q = J.u0 + J.dd * J.hu * clamp(u, 0, 1), p = contourAt(q), tg = V2.norm(V2.sub(contourAt(q + 0.004), contourAt(q - 0.004)))
    return [p[0] + tg[1] * 0.007, p[1] - tg[0] * 0.007]
  }
  // the pen walks out step by step and turns through its loops (one pass gives the whole curve, cached 20 times a second)
  const pen = (J: Model, tau: number, t: number): V => {
    if (!J.cache || J.cacheT !== Math.round(t * 20)) {
      const d = J.ell / KST, thA = J.th0 + wrapA(J.aim - J.th0)
      let p: V = J.D.slice()
      const pts: V[] = [p.slice()]
      const loop = (l: V, sl: number, tt: number) => {
        const lo = l[0] + 0.06 * Math.sin(0.27 * t + sl) - l[1] * 0.5
        return [l[2] * 6.2832 * gprof((tt - lo) / l[1]), ease((tt - lo) / 0.08) * ease((lo + l[1] - tt) / 0.08)]
      }
      for (let i = 0; i < KST; i++) {
        const tt = (i + 0.5) / KST
        let thb = J.th0 + (thA - J.th0) * ease(tt / J.bl)
        thb += SWAY * Math.sin(6.2832 * tt + J.ph + 0.6 * t) * ease(tt / 0.3)
        const a = loop(J.l1, J.sl1, tt), b = J.nl > 1 ? loop(J.l2, J.sl2, tt) : [0, 0]
        const th = thb + a[0] + b[0], drift = a[1] + b[1]
        p = V2.add(p, V2.mul(V2.add([Math.cos(th), Math.sin(th)], V2.mul([Math.cos(thb), Math.sin(thb)], LOOPDRIFT * drift)), d))
        pts.push(p.slice())
      }
      J.cache = pts; J.cacheT = Math.round(t * 20)
    }
    const x = clamp(tau, 0, 1) * KST, k = Math.min(Math.floor(x), KST - 1), f = x - k
    return [mix(J.cache[k][0], J.cache[k + 1][0], f), mix(J.cache[k][1], J.cache[k + 1][1], f)]
  }

  return {
    bodyPos,
    build(slot, L) {
      const J: Model = { L }, vr = Math.floor(slot / 6), base = fract(slot * 0.618034 + 0.37 * hash(L + 90))
      let u0 = base
      for (let k = 0; k < 10; k++) { if (CONT[Math.floor(fract(u0) * N) % N][2] > 0.5) break; u0 = fract(base + 0.0917 * (k + 1)) } // start on an outer edge
      J.u0 = u0; J.dd = hash(L + 95) < 0.5 ? -1 : 1
      const hug = 0.08 + 0.26 * hash(L + 96), S = contourAt(u0)
      J.hu = hug / PERIM
      J.sgn = S[0] < -0.02 ? -1 : S[0] > 0.02 ? 1 : hash(L + 97) < 0.5 ? -1 : 1
      J.bl = 0.18; J.D = bodyPos(J, 1)
      const T0 = V2.norm(V2.sub(J.D, bodyPos(J, 0.96)))
      J.th0 = Math.atan2(T0[1], T0[0])
      J.E0 = [J.sgn * (0.4 + 0.42 * hash(L + 70)), clamp(S[1] * 1.1 + (hash(L + 71) - 0.5) * 0.35, -0.4, 0.4)]
      const dist = V2.len(V2.sub(J.E0, J.D))
      J.aim = Math.atan2(J.E0[1] - J.D[1], J.E0[0] - J.D[0]) + J.sgn * 0.25
      const dirUp = 0.5 * (J.D[1] + J.E0[1]) < 0.12 ? 1 : -1, sig = dirUp * (Math.cos(J.aim) >= 0 ? 1 : -1), two = hash(L + 76) > 0.5
      const w1 = LOOPW + 0.16 * hash(L + 80), w2 = LOOPW - 0.04 + 0.14 * hash(L + 81)
      if (two && vr === 0) { J.nl = 2; J.l1 = [0.34 + 0.1 * hash(L + 82), w1, sig]; J.l2 = [0.74, w2, -sig] }
      else { J.nl = 1; J.l1 = [0.5 + 0.18 * (hash(L + 77) - 0.5), w1, sig]; J.l2 = [0, 1, 0] }
      J.sl1 = 6.28 * hash(L + 79 + Math.floor(J.l1[0] * 10)); J.sl2 = 6.28 * hash(L + 79 + Math.floor(J.l2[0] * 10)); J.ph = 6.28 * hash(L + 78)
      J.ell = 1.05 * dist + 0.38 * J.nl + 0.05; J.sc = hug / (hug + J.ell)
      return J
    },
    pos(J, s, tm) {
      const p = s < J.sc ? bodyPos(J, s / J.sc) : pen(J, (s - J.sc) / (1 - J.sc), tm)
      return [softClamp(p[0], 0.9, 0.12), softClamp(p[1], 0.49, 0.09), 0.02]
    },
  }
}
