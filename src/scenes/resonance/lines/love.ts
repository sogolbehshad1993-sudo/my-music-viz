// LOVE: a dense scribble filling the chest, then up to three hoops round the belly (behind the body too),
// then a soft hook out with a slow wave. Every 5th line goes round the head instead (the hair line).
import { V2, catmull, clamp, ease, hash, herm2, mix, softClamp, type V } from '../math.ts'
import type { Kind, Model } from './kind.ts'

const HAIR = [[0.0, 0.268], [0.045, 0.29], [0.07, 0.326], [0.052, 0.358], [0.074, 0.398], [0.046, 0.444], [0.0, 0.462], [-0.05, 0.438], [-0.078, 0.396], [-0.064, 0.352]]
const HOOP = [0.13, 0.085, 0.035], CHEST = [0.0, 0.222], CHESTR = [0.05, 0.038]
const ringW = (y: number) => 0.07 + 0.032 * ease((0.2 - y) / 0.28)

function bodyAt(J: Model, g: number, t: number): V {
  const gA = J.sA / J.sM, uc = clamp(g / gA, 0, 1), vh = g > gA ? (g - gA) / (1 - gA) : 0
  const phi = J.phi0 + 6.2832 * J.dk * (J.Rc * uc + J.nB * vh), br = 1 + 0.05 * Math.sin(0.471 * t + J.ph + 3 * g), beta = ease((g - gA + 0.04) / 0.12)
  const cc = [mix(J.st[0], CHEST[0], ease(uc / 0.25)), mix(J.st[1], CHEST[1], ease(uc / 0.25)) + 0.016 * Math.sin(6.2832 * 1.3 * uc + J.ph) * ease(uc / 0.25)], ac = J.aC * ease(uc / 0.12)
  const hv = vh * J.nB, hi = Math.floor(Math.min(Math.floor(hv), Math.max(J.nB - 1, 0))), hf = hv - hi, prevL = hi === 0 ? 0.172 : HOOP[hi - 1]
  const yh = J.nB < 0.5 ? 0.172 : mix(prevL, HOOP[hi], ease(hf * 1.4 - 0.1))
  const ah = ringW(yh) * J.aW * br, a = mix(ac, ah, beta), b = mix(J.bC, 0.03, beta), rt = J.rot * (1 - beta), c = [mix(cc[0], 0, beta), mix(cc[1], yh, beta)], e = [a * Math.sin(phi), b * Math.cos(phi)]
  return [c[0] + Math.cos(rt) * e[0] - Math.sin(rt) * e[1], c[1] + Math.sin(rt) * e[0] + Math.cos(rt) * e[1], phi]
}
function hairAt(J: Model, u: number): V {
  const x = clamp(u, 0, 1) * 9, i = Math.min(Math.floor(x), 8), t = x - i
  const q = catmull(HAIR[Math.max(i - 1, 0)], HAIR[i], HAIR[i + 1], HAIR[Math.min(i + 2, 9)], t)
  const la = 6.2832 * clamp((u - 0.12) / 0.26, 0, 1)
  return [q[0] * J.hs + 0.022 * J.hs * Math.sin(la), q[1] + 0.022 * 0.8 * (1 - Math.cos(la)), 0]
}
function exitAt(J: Model, u: number, t: number): V {
  const len = V2.len(V2.sub(J.E, J.Pc)), p = herm2(J.Pc, V2.mul(J.Tc, len * 1.4), J.E, [J.sg * len * 1.1, 0], u)
  return [p[0], p[1] + J.wv * Math.sin(9.4248 * u + J.ph + 0.5 * t) * Math.sin(Math.PI * u), 0]
}
const torsoW = (y: number) => 0.062 - 0.008 * ease((0.19 - y) / 0.09) + 0.011 * ease((0.1 - y) / 0.07)

export const Love: Kind = {
  build(slot, L, src) {
    const J: Model = { kind: slot % 5 === 3 ? 1 : 0, dk: hash(L + 11) < 0.5 ? -1 : 1, ph: 6.2832 * hash(L + 12), wv: 0.012 + 0.02 * hash(L + 21), L }
    J.hs = -J.dk
    J.st = [clamp(src[0], CHEST[0] - CHESTR[0], CHEST[0] + CHESTR[0]), clamp(src[1], CHEST[1] - CHESTR[1], CHEST[1] + CHESTR[1] + 0.03)] // born where its pins gathered
    J.Rc = 2.6 + 1.0 * hash(L + 15); J.aC = 0.058 + 0.012 * hash(L + 16); J.bC = 0.016 + 0.014 * hash(L + 18); J.rot = (hash(L + 24) - 0.5) * 0.9
    J.nB = Math.floor(hash(L + 19) * 3.99); J.aW = 0.92 + 0.16 * hash(L + 20)
    J.phi0 = 0; J.sA = 0.42; J.sM = 0.42
    if (J.kind < 0.5) {
      J.sM = J.sA + 0.1 * J.nB
      const target = hash(L + 17) < 0.5 ? 1.5708 : 4.7124
      J.phi0 = target - 6.2832 * J.dk * (J.Rc + J.nB)
      J.Pc = bodyAt(J, 1, 0).slice(0, 2); J.Tc = V2.norm(V2.sub(J.Pc, bodyAt(J, 0.992, 0).slice(0, 2))); J.sg = J.Pc[0] >= 0 ? 1 : -1
      J.E = [J.sg * (0.4 + 0.38 * hash(L + 22)), clamp(J.Pc[1] + (hash(L + 23) - 0.5) * 0.22, -0.05, 0.36)]
    } else {
      J.sM = 0.62; J.Pc = hairAt(J, 1).slice(0, 2); J.Tc = V2.norm(V2.sub(J.Pc, hairAt(J, 0.99).slice(0, 2))); J.sg = -J.hs
      J.E = [J.sg * (0.38 + 0.35 * hash(L + 22)), 0.3 + 0.14 * hash(L + 23)]
    }
    return J
  },
  pos(J, s, tm) {
    let p: V
    if (s < J.sM) { const u = s / J.sM; p = J.kind < 0.5 ? bodyAt(J, u, tm) : hairAt(J, u) } else p = exitAt(J, (s - J.sM) / (1 - J.sM), tm)
    const z = J.kind < 0.5 && s < J.sM ? 0.075 * Math.cos(p[2]) : 0 // the rings go round the body: the far half is behind it
    return [softClamp(p[0], 0.9, 0.12), softClamp(p[1], 0.49, 0.09), z]
  },
  vis(J, s, tm) {
    if (J.kind > 0.5 || s >= J.sM) return 1
    const g = s / J.sM, gA = J.sA / J.sM, p = bodyAt(J, g, tm), beta = ease((g - gA + 0.04) / 0.12)
    const back = ease((Math.cos(p[2]) - 0.05) / 0.35), inside = ease((torsoW(p[1]) + 0.01 - Math.abs(p[0])) / 0.02)
    return 1 - mix(0.55, 1, beta) * back * inside
  },
}
