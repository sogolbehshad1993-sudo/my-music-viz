// Pens: one batch of fat line segments (marker strokes) and one batch of soft round glows, refilled every frame.
// Colours are added like light (her canvas used 'lighter'), so each colour is sent already multiplied by its alpha.
import * as THREE from 'three/webgpu'
import { LineSegments2 } from 'three/addons/lines/webgpu/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { clamp, float, length, uv, vec3 } from 'three/tsl'
import { lin, type V } from './math.ts'

const glowing = { blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false } as const

/** a batch of segments `px` CSS pixels wide (at a 720 px tall frame) */
export function makeStroke(px: number, max: number) {
  const geo = new LineSegmentsGeometry()
  geo.setPositions(new Float32Array(max * 6))
  geo.setColors(new Float32Array(max * 6))
  const P = (geo.attributes.instanceStart as THREE.InterleavedBufferAttribute).data
  const C = (geo.attributes.instanceColorStart as THREE.InterleavedBufferAttribute).data
  const mat = new THREE.Line2NodeMaterial({ linewidth: px, vertexColors: true, ...glowing })
  const obj = new LineSegments2(geo, mat)
  obj.frustumCulled = false
  let n = 0
  return {
    obj,
    begin() { n = 0 },
    seg(a: V, b: V, c: V, alpha: number) {
      if (n >= max || alpha <= 0.002) return
      const k = n * 6
      P.array.set([a[0], a[1], a[2] || 0, b[0], b[1], b[2] || 0], k)
      const r = lin(c[0] * alpha), g = lin(c[1] * alpha), bl = lin(c[2] * alpha)
      C.array.set([r, g, bl, r, g, bl], k)
      n++
    },
    end(scale: number) {
      mat.linewidth = px * scale
      geo.instanceCount = n
      P.needsUpdate = true
      C.needsUpdate = true
    },
  }
}

/** soft round glows (births and line heads), drawn facing the camera; size in CSS pixels at a 720 px tall frame */
export function makeGlows(max: number) {
  const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, ...glowing })
  // her radial gradient: 1 at the middle, 0.85 at 28 %, 0.25 at 45 %, 0 at the edge
  const d = length(uv().sub(0.5)).mul(2)
  const ramp = (a: number, w: number) => clamp(d.sub(a).div(w), 0, 1)
  mat.colorNode = vec3(1)
  mat.opacityNode = float(1).sub(ramp(0, 0.28).mul(0.15)).sub(ramp(0.28, 0.17).mul(0.6)).sub(ramp(0.45, 0.55).mul(0.25))
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, max)
  mesh.frustumCulled = false
  mesh.setColorAt(0, new THREE.Color(0)) // make the colour buffer now, so the shader is built with it
  mesh.count = 0
  const m = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), s = new THREE.Vector3()
  let n = 0
  return {
    mesh,
    begin() { n = 0 },
    /** w: world position; radius in pixels; perPx: world size of one pixel at that depth */
    dot(w: THREE.Vector3, radius: number, perPx: number, c: V, alpha: number) {
      if (n >= max || alpha <= 0.002) return
      const size = 2 * radius * perPx
      m.compose(w, q, s.set(size, size, 1))
      mesh.setMatrixAt(n, m)
      mesh.setColorAt(n, col.setRGB(lin(c[0] * alpha), lin(c[1] * alpha), lin(c[2] * alpha)))
      n++
    },
    end() {
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    },
  }
}
