// <name>: one line on what this experiment is. Brief: memory/experiments.md
import * as THREE from 'three/webgpu'
import { cos, mix, mx_noise_float, normalLocal, positionLocal, sin, vec3 } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import gsap from 'gsap'
import type { Config, Ctx } from '../runtime'

export const config: Config = { output: 'web', loop: 8 }

export default (ctx: Ctx) => {
  const p = ctx.params({
    warp: [0.2, 0, 0.6],
    a: '#ff3366',
    b: '#33ccff',
    glow: [0.6, 0, 2],
    pulse: () => gsap.fromTo(mesh.scale, { x: 1.25, y: 1.25, z: 1.25 }, { x: 1, y: 1, z: 1, duration: 1, ease: 'elastic.out' }),
  })
  const energy = ctx.input('energy', { source: 'lfo' })

  // Seamless loop: move through noise on a circle driven by ctx.phase (0..1 per loop).
  const angle = ctx.phase.mul(Math.PI * 2)
  const n = mx_noise_float(positionLocal.mul(1.5).add(vec3(cos(angle), sin(angle), 0)))
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.35, metalness: 0.1 })
  mat.colorNode = mix(p.a, p.b, n.mul(0.5).add(0.5))
  mat.positionNode = positionLocal.add(normalLocal.mul(n.mul(p.warp).mul(energy.add(0.5))))

  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 64), mat)
  const light = new THREE.DirectionalLight('#ffffff', 3)
  light.position.set(2, 3, 4)
  ctx.scene.add(mesh, light, new THREE.HemisphereLight('#ffffff', '#111122', 1))

  ctx.orbit()
  ctx.post((color) => color.add(bloom(color, p.glow, 0.2, 0.7)))
  ctx.frame((_t, dt) => (mesh.rotation.y += dt * 0.2))
}
