// Her stipple body (4 Nov, the How We Feel look): 82,887 tiny points on her body surface, the eight places, Joy's outline.
import { E } from './emotions.ts'
import { ease, hash, type V } from './math.ts'

type Organ = { c: V; r: V }
export type Body = {
  n: number
  pos: Float32Array // x y z
  nrm: Float32Array // nx nz (the normal's side and depth: enough for the rim light)
  zone: Float32Array // which place (index into E), -1 none
  zw: Float32Array // 1 in the middle of its place, fading to 0 at the edge
  grain: Float32Array // 0.85..1.15, each grain's own strength
  org: Record<string, Organ[]>
  region: Record<string, number[]> // front points inside each place: they can give birth
  cont: V[] // Joy's outline, 128 points round the figure
}

const orgD = (x: number, y: number, z: number, o: Organ, s: number) =>
  Math.hypot((x - o.c[0]) / (o.r[0] * s), (y - o.c[1]) / (o.r[1] * s), (z - o.c[2]) / (o.r[2] * s * 2.5))

export async function loadBody(url: string): Promise<Body> {
  const D = await (await fetch(url)).json()
  const org: Record<string, Organ[]> = {}
  for (const [n, c, r] of D.organs) (org[n] ||= []).push({ c, r })

  const bin = atob(D.stip), q = new Int16Array(bin.length / 2)
  for (let i = 0; i < q.length; i++) q[i] = ((bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)) << 16) >> 16
  const n = q.length / 6
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 2), zone = new Float32Array(n), zw = new Float32Array(n), grain = new Float32Array(n)
  const region: Record<string, number[]> = Object.fromEntries(E.map((e) => [e.n, []]))
  const names = Object.keys(org)

  for (let j = 0; j < n; j++) {
    const x = q[6 * j] / 1e4, y = q[6 * j + 1] / 1e4, z = q[6 * j + 2] / 1e4
    pos.set([x, y, z], 3 * j)
    nrm.set([q[6 * j + 3] / 1e4, q[6 * j + 5] / 1e4], 2 * j)
    grain[j] = 0.85 + 0.3 * hash(j * 7.7)
    zone[j] = -1
    for (const nm of names) {
      const d = Math.min(...org[nm].map((o) => orgD(x, y, z, o, 1.3)))
      if (d < 1) { zone[j] = E.findIndex((e) => e.n === nm); zw[j] = 1 - ease((d - 0.45) / 0.55); break }
    }
    if (z > 0.01) for (const nm of names) if (org[nm].some((o) => orgD(x, y, z, o, 1.4) < 1)) region[nm].push(j)
  }
  return { n, pos, nrm, zone, zw, grain, org, region, cont: D.cont }
}
