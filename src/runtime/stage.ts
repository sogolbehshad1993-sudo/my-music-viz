// One renderer and one canvas for the whole session. Survives scene hot reloads.
import * as THREE from 'three/webgpu'
import { Inspector } from 'three/addons/inspector/Inspector.js'

export const url = new URLSearchParams(location.search)

export const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: url.has('webgl') })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
if (url.has('debug')) renderer.inspector = new Inspector()
document.body.appendChild(renderer.domElement)
await renderer.init()
export const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'webgpu' : 'webgl2'

// Frame: fills the window, or a letterboxed rectangle when an aspect is set (projection targets).
let aspect: number | undefined
let onResize = (_w: number, _h: number) => {}
export function fit(a: number | undefined, cb: (w: number, h: number) => void) {
  aspect = a
  onResize = cb
  resize()
}
function resize() {
  let w = innerWidth
  let h = innerHeight
  if (aspect) w / h > aspect ? (w = Math.round(h * aspect)) : (h = Math.round(w / aspect))
  renderer.setSize(w, h)
  onResize(w, h)
}
addEventListener('resize', resize)

// Clock: pausable.
export const clock = {
  engine: 0, // seconds since boot, pausable (drives GSAP and inputs)
  t: 0, // seconds since the scene started
  paused: false,
  last: performance.now(),
  step() {
    const now = performance.now()
    const dt = this.paused ? 0 : Math.min((now - this.last) / 1000, 0.1)
    this.last = now
    this.engine += dt
    this.t += dt
    return dt
  },
}

if (import.meta.hot) import.meta.hot.accept(() => location.reload())
