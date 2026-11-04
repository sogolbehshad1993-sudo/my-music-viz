// Drawing one frame of births and lines, the way her web build did:
// births: the 5 grains light up and flow together (a soft swirl) into one drop;
// lines: a wide faint glow pass and a bright core pass, white at the head turning into the emotion's colour behind it,
// a dashed route ahead (where this knob lets it reach), Disgust's ghost copy, and the glowing drop at the head.
import * as THREE from 'three/webgpu'
import type { Body } from './data.ts'
import { WHITE, lenOf } from './emotions.ts'
import type { Birth, Live } from './life.ts'
import type { Kind } from './lines/kind.ts'
import { E as EMO } from './emotions.ts'
import { clamp, ease, fract, hash, mix, type V } from './math.ts'
import type { VoidState } from './void.ts'
import { makeGlows, makeStroke } from './pens.ts'

const N = 200 // samples along every line
const PX = 360 / Math.tan((22.5 * Math.PI) / 180) // pixels per world unit at distance 1, for a 720 px tall frame

export function makeDraw(B: Body, KIND: Record<string, Kind>, group: THREE.Group, camera: THREE.Camera) {
  const wide = makeStroke(4.0, 12000), core = makeStroke(1.2, 12000), thin = makeStroke(1.0, 16000), smear = makeStroke(1.8, 4600), glows = makeGlows(600)
  const pens = [wide, core, thin, smear]
  pens.forEach((p) => group.add(p.obj))
  // about 4300 points become smears in the burst, each swirling a little
  const SMEARS = Array.from({ length: B.n }, (_, i) => i).filter((i) => hash(i * 0.77 + 3) <= 4300 / B.n)
  const w = new THREE.Vector3()
  const glowAt = (p: V, r: number, c: V, a: number) => {
    group.localToWorld(w.set(p[0], p[1], p[2] || 0))
    glows.dot(w, r, (camera.position.z - w.z) / PX, c, a)
  }

  function births(list: Birth[]) {
    for (const { e, d, tau } of list) {
      const u = clamp((tau - 0.4) / 2.7, 0, 1)
      if (u <= 0) continue
      const pins = d.pins.filter((j) => j >= 0), M = [0, 0, 0]
      pins.forEach((j) => { for (let k = 0; k < 3; k++) M[k] += B.pos[3 * j + k] / pins.length })
      const f = ease((u - 0.12) / 0.7), g = Math.pow(1 - f, 1.6), swl = 0.9 * f, kk = ease((u - 0.86) / 0.14), meet = ease((f - 0.75) / 0.25)
      const env = ease(tau / 0.4), r = (2.2 + 1.4 * f * f) * (1 + 0.35 * meet), a = env / (1 + 1.2 * f * f) // overlapping drops add up: softer as they meet
      const c = e.col.map((v, i) => mix(v, WHITE[i], 0.55 + 0.25 * meet))
      for (const j of pins) {
        let dx = (B.pos[3 * j] - M[0]) * g, dy = (B.pos[3 * j + 1] - M[1]) * g
        ;[dx, dy] = [dx * Math.cos(swl) - dy * Math.sin(swl), dx * Math.sin(swl) + dy * Math.cos(swl)]
        glowAt([mix(M[0] + dx, d.src[0], kk), mix(M[1] + dy, d.src[1], kk), mix(B.pos[3 * j + 2], d.src[2], kk)], r * 3, c, a)
      }
    }
  }

  function lines(list: Live[], tSim: number, V: VoidState) {
    for (const { e, d, reach, fade, m } of list) {
      if (reach <= 0) continue
      const mod = KIND[e.n], M = d.model, lenE = lenOf(e), nH = Math.max(2, Math.floor(reach * (N - 1)))
      // in the void the whole line flies out as one piece
      const far = V.burst * (0.5 + 1.2 * hash(d.L * 1.37 + e.eo * 7)), dir = Math.atan2(d.src[1] - 0.1, d.src[0] || 0.001), fx = Math.cos(dir) * far, fy = Math.sin(dir) * far
      const at = (i: number, g: V = [0, 0]) => { const p = mod.pos(M, i / (N - 1), tSim, m); return [p[0] + g[0] + fx, p[1] + g[1] + fy, p[2]] }
      const bright = fade * (V.rising ? (V.burst > 0 ? V.fade : 1) : 1 - V.dark) * (0.85 + 0.9 * m) * 0.8 * (1 + 0.8 * V.white)
      const toWhite = (c: V): V => (V.white > 0 ? c.map((v) => mix(v, 1, V.white * (1 - ease((V.hv - 3.3) / 1.2)))) : c)
      const seen = (i: number) => (mod.mask ? mod.mask(M, i / (N - 1), tSim) : 1) * (mod.vis ? mod.vis(M, i / (N - 1), tSim) : 1)
      const colAt = (i: number): V => {
        const back = (nH - i) / (N - 1) // white at the head, then light, then its own colour
        return back < 0.02 ? e.light.map((v, k) => mix(WHITE[k], v, back / 0.02)) : e.light.map((v, k) => mix(v, e.col[k], ease((back - 0.02) / (0.22 * lenE))))
      }
      const pts: V[] = []
      for (let i = 0; i <= nH; i++) pts.push(at(i))
      for (let i = 1; i < pts.length; i++) {
        const a = seen(i) * bright * e.glow * 0.8
        if (a <= 0.01) continue
        const c = toWhite(colAt(i))
        wide.seg(pts[i - 1], pts[i], c, 0.09 * a)
        core.seg(pts[i - 1], pts[i], c, 0.9 * a)
        if (mod.ghost) { const g = mod.ghost(M, i / (N - 1), tSim); thin.seg(at(i - 1, g), at(i, g), e.light, 0.35 * bright) }
      }
      const nEnd = Math.floor(lenE * (N - 1)) // the route still to come: dash, gap, dash
      if (V.white <= 0) for (let i = nH + 3; i < nEnd; i += 4) thin.seg(at(i), at(Math.min(i + 2, nEnd)), e.light, 0.3 * bright * (1 - (0.5 * (i - nH)) / Math.max(nEnd - nH, 1)))
      // the head: the drop that was born goes on, glowing as it leaves (Anger bursts, Sorrow leaves softly)
      const burstK = e.n === 'Sorrow' ? 0.6 : e.n === 'Anger' ? 2.5 : 1.4
      const hb = (1 + burstK * (1 - ease(reach / (0.2 * lenE)))) * bright * (1 - ease((reach - 0.95 * lenE) / (0.05 * lenE)))
      glowAt(pts[pts.length - 1], 5, e.light, 0.25 * hb)
      glowAt(pts[pts.length - 1], 1.6, WHITE, 0.6 * hb)
    }
  }

  function smears(V: VoidState) {
    const back = ease((V.hv - 3.15) / 0.6), a = 0.38 * V.fade * 0.8 // the colours of all the feelings come back as it bursts
    for (const i of SMEARS) {
      const x = B.pos[3 * i], y = B.pos[3 * i + 1], z = B.pos[3 * i + 2], hh = hash(i * 0.77 + 3)
      const cu = (fract(hh * 7.3) - 0.5) * 1.4 * V.burst, uy = y - 0.1, dx = x * Math.cos(cu) - uy * Math.sin(cu), dy = x * Math.sin(cu) + uy * Math.cos(cu)
      const dl = Math.hypot(dx, dy, z) || 1, far = V.burst * (0.25 + 0.8 * hh)
      const zi = B.zone[i], base = zi >= 0 ? EMO[zi].place : EMO[Math.floor(fract(hh * 13.7) * 8)].col
      const c = base.map((v) => mix(1, v, back))
      smear.seg([x + (dx / dl) * far * 0.9, y + (dy / dl) * far * 0.9, z + (z / dl) * far * 0.9], [x + (dx / dl) * far, y + (dy / dl) * far, z + (z / dl) * far], c, a)
    }
  }

  return {
    frame(b: Birth[], l: Live[], tSim: number, scale: number, V: VoidState) {
      for (const p of pens) p.begin()
      glows.begin()
      if (V.white <= 0 && V.dark <= 0.05) births(b)
      lines(l, tSim, V)
      if (V.rising && V.burst > 0 && V.fade > 0) smears(V)
      for (const p of pens) p.end(scale)
      glows.end()
    },
    glowMesh: glows.mesh,
  }
}
