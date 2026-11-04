// Pointer state for scenes.
//   pointer.ndc       TSL vec2 uniform, -1..1, y up (use in shaders or read .value in JS)
//   pointer.down      button held
//   pointer.look()    mouse movement since the last call, in pixels (works under pointer lock)
//   pointer.lock()    pointer lock for mouse-look; Esc releases it
//   pointer.hit(camera, objects)  raycast under the cursor
import { Raycaster, Vector2, type Camera, type Object3D } from 'three/webgpu'
import { uniform } from 'three/tsl'
import { renderer } from '../runtime/stage.ts'

const el = renderer.domElement
const moved = new Vector2()
const ray = new Raycaster()

export const pointer = {
  ndc: uniform(new Vector2()),
  down: false,
  get locked() {
    return document.pointerLockElement === el
  },
  lock: () => el.requestPointerLock(),
  unlock: () => document.exitPointerLock(),
  look() {
    const d = moved.clone()
    moved.set(0, 0)
    return d
  },
  hit(camera: Camera, objects: Object3D[]) {
    ray.setFromCamera(pointer.ndc.value, camera)
    return ray.intersectObjects(objects, true)[0]
  },
}

addEventListener('pointermove', (e) => {
  const r = el.getBoundingClientRect()
  pointer.ndc.value.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  moved.x += e.movementX
  moved.y += e.movementY
})
addEventListener('pointerdown', () => (pointer.down = true))
addEventListener('pointerup', () => (pointer.down = false))
