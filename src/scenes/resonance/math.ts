// Small number helpers shared by the Resonance files (same maths as her web build, so every line lands where it did).
export type V = number[]

export const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b)
export const ease = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x) }
export const boom = (x: number) => { x = clamp(x, 0, 1); return 1 - (1 - x) * (1 - x) * (1 - x) }
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const fract = (x: number) => x - Math.floor(x)
export const hash = (n: number) => fract(Math.sin(n) * 43758.5453)
export const hex = (h: string): V => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
export const lum = (c: V) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
/** her canvas colours are display (sRGB) values; three works in linear light */
export const lin = (v: number) => Math.pow(clamp(v, 0, 8), 2.2)

export const V2 = {
  add: (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]],
  sub: (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]],
  mul: (a: V, k: number): V => [a[0] * k, a[1] * k],
  len: (a: V) => Math.hypot(a[0], a[1]),
  norm: (a: V): V => { const l = Math.hypot(a[0], a[1]) || 1e-9; return [a[0] / l, a[1] / l] },
}
export const FL = -0.44
export const JIT = (L: number, k: number, a: number) => (hash(L + 60 + k) - 0.5) * a
export const softClamp = (v: number, lim: number, m: number) => {
  const a = lim - m, s = v >= 0 ? 1 : -1
  v = Math.abs(v)
  return s * (v < a ? v : a + m * Math.tanh((v - a) / m))
}

/** smooth B-spline: flows NEAR the anchor points */
function bs(p0: V, p1: V, p2: V, p3: V, t: number): V {
  const t2 = t * t, t3 = t2 * t, u = 1 - t, a = (u * u * u) / 6, b = (3 * t3 - 6 * t2 + 4) / 6, c = (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, d = t3 / 6
  return [0, 1, 2].map((k) => a * p0[k] + b * p1[k] + c * p2[k] + d * p3[k])
}
export function spline12(A: V[], s: number): V {
  const u = s * 13, seg = Math.min(Math.floor(u), 12), lt = u - seg
  const c = [0, 1, 2, 3].map((q) => A[clamp(seg + q - 2, 0, 11)])
  return bs(c[0], c[1], c[2], c[3], lt)
}
export function herm2(p0: V, m0: V, p1: V, m1: V, t: number): V {
  const t2 = t * t, t3 = t2 * t, a = 2 * t3 - 3 * t2 + 1, b = t3 - 2 * t2 + t, c = -2 * t3 + 3 * t2, d = t3 - t2
  return [a * p0[0] + b * m0[0] + c * p1[0] + d * m1[0], a * p0[1] + b * m0[1] + c * p1[1] + d * m1[1]]
}
/** Catmull-Rom through a list of 2D points (Love's hair line, Joy's outline) */
export function catmull(p0: V, p1: V, p2: V, p3: V, t: number): V {
  return [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t))
}
