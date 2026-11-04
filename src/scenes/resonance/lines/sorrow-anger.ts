// SORROW: a soft slow curl on the heart, then one of four ways down: the leg to the floor, the hip and up, over the shoulder, a wide loop.
// ANGER: jagged chains from the forehead and both fists, aimed at their own end points across the frame; some step at right angles.
import { FL, JIT, V2, clamp, hash, mix, spline12, type V } from '../math.ts'
import type { Kind } from './kind.ts'

export const Sorrow: Kind = {
  build(_slot, L, H) {
    const side = hash(L) > 0.45 ? 1 : -1, kind = hash(L + 50), ph = hash(L + 3) * 6.2832, turn = hash(L + 9) > 0.5 ? 1 : -1, A: V[] = []
    for (let k = 0; k < 5; k++) {
      const a = ph + turn * k * 1.1, r = 0.006 + 0.007 * k
      A.push([H[0] + r * Math.cos(a), H[1] + 0.6 * r * Math.sin(a) - 0.004 * k, (H[2] || 0) + 0.4 * r * Math.sin(a)])
    }
    const P = (x: number, y: number, z = 0) => A.push([x, y, z])
    const h = (k: number) => hash(L + k), j = (k: number, a: number) => JIT(L, k, a)
    if (kind < 0.65) {
      const lx = side * 0.045
      P(0.5 * lx + j(0, 0.04), 0.02); P(lx + j(1, 0.03), -0.15); P(lx + j(2, 0.02), -0.32); P(side * 0.055, FL); P(side * (0.12 + 0.12 * h(33)), FL + 0.01 + j(3, 0.02))
      P(side * (0.22 + 0.16 * h(34)) + j(4, 0.06), -0.3 + 0.3 * h(35), j(5, 0.08)); P(side * (0.15 + 0.25 * h(36)) + j(6, 0.08), -0.25 + 0.45 * h(37), j(7, 0.08))
    } else if (kind < 0.88) {
      const ey = -0.3 + 0.28 * h(38)
      P(side * 0.03 + j(0, 0.04), 0.03); P(side * 0.07 + j(1, 0.03), ey + 0.08); P(side * 0.14, ey + j(2, 0.05))
      P(side * (0.24 + 0.12 * h(39)), ey - 0.06 + j(3, 0.06), j(4, 0.06)); P(side * (0.34 + 0.12 * h(40)), ey + 0.15 + j(5, 0.1), j(6, 0.08))
      P(side * (0.28 + 0.14 * h(41)), ey + 0.32 + 0.15 * h(42), j(7, 0.08)); P(side * (0.18 + 0.2 * h(43)) + j(8, 0.1), 0.05 + 0.35 * h(44), j(9, 0.08))
    } else if (kind < 0.95) {
      P(0.03 + side * 0.01 + j(0, 0.02), 0.27); P(side * 0.07 + j(1, 0.02), 0.36); P(side * 0.2, 0.41 + j(2, 0.04), j(3, 0.05))
      P(side * (0.32 + 0.1 * h(45)), 0.3 + j(4, 0.08), j(5, 0.08)); P(side * (0.36 + 0.1 * h(46)), 0.08 + j(6, 0.1), j(7, 0.08))
      P(side * (0.3 + 0.12 * h(47)), -0.12 + j(8, 0.12), j(9, 0.08)); P(side * (0.22 + 0.15 * h(48)), -0.3 + 0.2 * h(49), j(10, 0.08))
    } else {
      P(side * 0.02, 0.28 + j(0, 0.02)); P(side * 0.12, 0.33 + j(1, 0.02), j(2, 0.04)); P(side * (0.24 + 0.08 * h(51)), 0.26 + j(3, 0.04), j(4, 0.08))
      P(side * (0.26 + 0.1 * h(52)), -0.28 + j(5, 0.08), j(6, 0.08)); P(side * (0.16 + 0.1 * h(53)), -0.38 + j(7, 0.05), j(8, 0.06))
      P(side * (0.1 + 0.08 * h(54)), -0.22 + j(9, 0.08), j(10, 0.06)); P(side * (0.2 + 0.18 * h(55)), 0.3 * h(56), j(11, 0.08))
    }
    const wf = h(59) > 0.67 ? 1.3 : 1.0 // about 1 in 3 lines swings wider
    for (let k = 8; k < 12; k++) { A[k][0] *= wf; A[k][2] *= wf }
    return { A, L }
  },
  pos(m, s, tm, mus) {
    const p = spline12(m.A, s), ph = hash(m.L + 3) * 6.2832, w = clamp((s - 0.36) * 6, 0, 1), amp = 0.006 + 0.008 * hash(m.L + 57) + 0.035 * mus, fr = 1.5 + 1.5 * hash(m.L + 58), mv = tm * 0.6
    return [p[0] + w * amp * Math.sin(fr * s + ph + mv), p[1] + w * amp * Math.cos(fr * s + ph * 1.3 + mv), p[2]]
  },
}

const HEADTIP = [[0.78, 0.3], [-0.8, 0.22], [0.66, 0.08], [-0.6, 0.45], [0.56, 0.46], [-0.7, 0.04], [0.86, 0.16], [-0.86, 0.36], [0.84, 0.42], [-0.84, 0.12], [0.44, 0.22], [-0.44, 0.3]]
const FISTTIP = [[0.6, -0.3], [0.84, -0.14], [0.44, -0.46], [0.86, -0.42]]

export const Anger: Kind = {
  build(slot, L, O) {
    const src = slot % 5, row = Math.floor(slot / 5), fist = src === 1 || src === 2
    let E: V
    if (src === 1) { const f = FISTTIP[row % 4]; E = [-f[0], f[1]] }
    else if (src === 2) E = FISTTIP[(row + 1) % 4].slice()
    else E = HEADTIP[(row * 3 + (src === 0 ? 0 : src - 2)) % 12].slice()
    const r0 = fist ? 0.02 : 0.035
    E = [E[0] + (hash(L + 70) - 0.5) * 0.08, E[1] + (hash(L + 71) - 0.5) * 0.05]
    const ex = V2.norm([E[0] - O[0], (E[1] - O[1]) * (fist ? 1 : 2.5)])
    const A: V[] = [[O[0] + ex[0] * r0, O[1] + ex[1] * (fist ? r0 : 0.05), O[2] || 0]]
    const dir = V2.norm(V2.sub(E, A[0])), ang = Math.atan2(dir[1], dir[0]), D = V2.len(V2.sub(E, A[0])), steps = hash(L + 13) < 0.35
    for (let k = 1; k < 7; k++) {
      const turn = (hash(L + 20 + k) - 0.5) * 0.6, dk: V = [Math.cos(ang + turn), Math.sin(ang + turn)], nk: V = [-dk[1], dk[0]], len = (D / 6) * (0.7 + 0.6 * hash(L + 30 + k))
      const side = k % 2 === 0 ? 1 : -1, near = k === 1 ? 0.3 : k === 2 ? 0.6 : 1, zig = len * (0.15 + 0.35 * hash(L + 40 + k)) * side * near
      const sv = steps ? (k % 2 === 0 ? V2.mul(dk, len * 1.4) : V2.mul(nk, zig * 1.4)) : V2.add(V2.mul(dk, len), V2.mul(nk, zig))
      A.push([A[k - 1][0] + sv[0], A[k - 1][1] + sv[1], 0.02 * (hash(L + 50 + k) - 0.5)])
    }
    // turn and scale the chain so it ends exactly on its end point
    const g = V2.sub(A[6], A[0]), t = V2.sub(E, A[0]), rot = Math.atan2(t[1], t[0]) - Math.atan2(g[1], g[0]), sc = V2.len(t) / Math.max(V2.len(g), 1e-4), c = Math.cos(rot), s = Math.sin(rot)
    for (let k = 1; k < 7; k++) { const dx = (A[k][0] - A[0][0]) * sc, dy = (A[k][1] - A[0][1]) * sc; A[k] = [A[0][0] + c * dx - s * dy, A[0][1] + s * dx + c * dy, A[k][2]] }
    for (let k = 1; k < 6; k++) { A[k][0] = clamp(A[k][0], -0.9, 0.9); A[k][1] = clamp(A[k][1], -0.5, 0.5) }
    return { A, L }
  },
  pos(m, s) {
    const u = clamp(s, 0, 1) * 6, seg = Math.min(Math.floor(u), 5), f = u - seg
    return [0, 1, 2].map((k) => mix(m.A[seg][k], m.A[seg + 1][k], f))
  },
}
