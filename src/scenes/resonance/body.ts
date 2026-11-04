// The stipple body: one grain of light per point (1 device pixel, added up like her grain buffer).
// Dim where the surface faces you, bright at the rim, the back half only whispers; each place tints its own grains.
import * as THREE from 'three/webgpu'
import { abs, attribute, clamp, float, int, max, mix, pow, sin, step, uniform, uniformArray, vec3 } from 'three/tsl'
import type { Body } from './data.ts'
import { E } from './emotions.ts'
import { hash } from './math.ts'

type Arr = ReturnType<typeof uniformArray>
// uniformArray elements come back loosely typed: name what they hold
const f1 = (a: Arr, i: THREE.Node) => a.element(i) as unknown as THREE.Node<'float'>
const f3 = (a: Arr, i: THREE.Node) => a.element(i) as unknown as THREE.Node<'vec3'>

export function makeBody(B: Body, time: THREE.UniformNode<'float'>) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(B.pos, 3))
  g.setAttribute('nrm', new THREE.BufferAttribute(B.nrm, 2))
  g.setAttribute('zone', new THREE.BufferAttribute(B.zone, 1))
  g.setAttribute('zw', new THREE.BufferAttribute(B.zw, 1))
  g.setAttribute('grain', new THREE.BufferAttribute(B.grain, 1))
  const hide = new THREE.BufferAttribute(new Float32Array(B.n), 1).setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('hide', hide)
  g.setAttribute('hh', new THREE.BufferAttribute(Float32Array.from({ length: B.n }, (_, i) => hash(i * 0.77 + 3)), 1)) // the order points come back after the void

  const sway = uniform(0) // the body's turn (radians), so the rim follows it
  const placeCol = uniformArray(E.map((e) => new THREE.Vector3(...e.place)), 'vec3')
  const pglow = uniformArray(E.map((e) => e.pglow), 'float')
  const tint = uniformArray(E.map(() => 0), 'float') // ease(knob / 8): the place shows as soon as its knob moves
  const lit = uniformArray(E.map(() => 0), 'float') // the place glows while it gives birth
  const mus = uniformArray(E.map(() => 0), 'float') // and breathes with its music
  const vWhite = uniform(0), vShade = uniform(0), vReturn = uniform(0) // the void: white, only the dark shade, the slow return

  const nrm = attribute('nrm', 'vec2'), zf = attribute('zone', 'float'), zw = attribute('zw', 'float')
  const nv = nrm.y.mul(sway.cos()).sub(nrm.x.mul(sway.sin()))
  const rim = float(1).sub(abs(nv))
  const face = mix(float(0.22), float(1), step(0, nv))
  const b = float(0.3).add(pow(rim, 2.5).mul(0.95)).mul(face).mul(attribute('grain', 'float')).mul(float(1).sub(attribute('hide', 'float')))
  const c0 = vec3(b.mul(0.92), b.mul(0.92), b.mul(0.975))

  const inZone = step(0, zf), zi = int(max(zf, 0)), col = f3(placeCol, zi)
  const v = f1(tint, zi).mul(zw).mul(0.8).mul(inZone)
  const c1 = mix(c0, col.mul(b.mul(0.9).add(0.35)).mul(f1(pglow, zi)), v)
  const pulse = sin(time.mul(3).add(attribute('position', 'vec3').x.mul(40))).mul(0.5).add(0.5)
  const w = clamp(f1(lit, zi).mul(0.6).add(f1(mus, zi).mul(0.5).mul(pulse)), 0, 1.2).mul(zw).mul(inZone)
  const c2 = mix(c1.mul(w.mul(0.9).add(1)), mix(col, vec3(1), 0.45), w.mul(0.5))

  // the void: sudden white; after the burst only the dark shade of the body (its outline); then the points come back one by one
  const cW = mix(c2, vec3(face.mul(0.45).add(0.55), face.mul(0.45).add(0.55), face.mul(0.45).add(0.58)), vWhite)
  const shade = vec3(0.8, 0.8, 0.9).mul(clamp(float(1).sub(abs(nv).div(0.55)), 0, 1).mul(face).mul(0.3).mul(vShade))
  const back = float(1).sub(step(attribute('hh', 'float'), vReturn))
  const c3 = vShade.greaterThan(0).select(shade, cW.mul(back))

  const mat = new THREE.PointsNodeMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false })
  mat.colorNode = pow(clamp(c3.mul(0.85), 0, 4), vec3(2.2)) // her values are display colours: into linear light
  const points = new THREE.Points(g, mat)
  points.frustumCulled = false

  return { points, hide, sway, tint, lit, mus, vWhite, vShade, vReturn }
}
