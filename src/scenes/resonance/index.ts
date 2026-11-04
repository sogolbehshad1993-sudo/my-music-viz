// resonance: her web body in the playground. The stipple body, the 8 places (palette B), her Love.32 lines, births, knob rule.
// Brief and source: memory/experiments.md, resonance-web/template.html (4 Nov 2026, the approved stipple build).
import * as THREE from 'three/webgpu'
import type { Config, Ctx } from '../../runtime'
import { loadBody } from './data.ts'
import { makeBody } from './body.ts'
import { E } from './emotions.ts'
import { ease } from './math.ts'
import { makeLife } from './life.ts'
import { makeDraw } from './draw.ts'
import { makeVoid } from './void.ts'

export const config: Config = { output: 'wall', aspect: 16 / 9 } // her projector frame, 1280 x 720

// her opening state: Love and Sorrow, like Arash's first study
const START: Record<string, number> = { Love: 0.45, Sorrow: 0.4 }

export default async (ctx: Ctx) => {
  const p = ctx.params({ sway: [28.6, 0, 45], swayPeriod: [24, 6, 60], slow: [0.3, 0.05, 1], allAt100: false }) // allAt100: try the void without moving 8 sliders
  const knob = E.map((e) => ctx.input(e.n.toLowerCase(), { source: 'slider', value: START[e.n] || 0 }))
  const music = ctx.input('music', { source: 'slider', value: 0.4 })

  // the same camera as her web build: vertical fov 45, at y 0.02, 1.30 in front of the body
  ctx.camera.fov = 45
  ctx.camera.position.set(0, 0.02, 1.3)
  ctx.camera.lookAt(0, 0.02, 0)
  ctx.camera.updateProjectionMatrix()

  const B = await loadBody('/assets/resonance/body.json')
  const body = makeBody(B, ctx.time)
  const group = new THREE.Group() // everything that sways with the body: grains, lines, births
  group.add(body.points)
  ctx.scene.add(group)
  const life = makeLife(B)
  const draw = makeDraw(B, life.KIND, group, ctx.camera)
  ctx.scene.add(draw.glowMesh)
  const hide = body.hide.array as Float32Array
  const theVoid = makeVoid()

  let tSim = 20 // start a little in, so lines are already on screen
  ctx.frame((_t, dt) => {
    tSim += dt
    E.forEach((e, i) => (e.knob = p.allAt100.value ? 100 : knob[i].value * 100))
    const sw = ((p.sway.value * Math.PI) / 180) * Math.sin((2 * Math.PI * tSim) / p.swayPeriod.value)
    group.rotation.y = sw
    body.sway.value = sw
    group.updateMatrixWorld()

    hide.fill(0) // grains that became a line are away
    const now = life.step(tSim * p.slow.value, tSim, music.value, hide)
    body.hide.needsUpdate = true
    E.forEach((e, i) => {
      body.tint.array[i] = ease(e.knob / 8)
      body.lit.array[i] = now.LIT[i]
      body.mus.array[i] = now.MUS[i]
    })
    const V = theVoid(E.every((e) => e.knob >= 95), dt)
    body.vWhite.value = V.white
    body.vShade.value = V.rising && V.burst > 0 ? Math.max(V.dark, 1e-4) : 0
    body.vReturn.value = V.rising ? 0 : V.dark
    draw.frame(now.births, now.lines, tSim, ctx.renderer.domElement.clientHeight / 720, V)
  })
}
