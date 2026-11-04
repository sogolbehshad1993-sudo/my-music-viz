// Everything a scene creates is tracked here and torn down when it unloads.
import type * as THREE from 'three/webgpu'
import gsap from 'gsap'

export function createScope(scene: THREE.Scene) {
  const frames: ((t: number, dt: number) => void)[] = []
  const cleanups: (() => void)[] = []
  return {
    frames,
    cleanup: (fn: () => void) => cleanups.push(fn),
    on(target: EventTarget, type: string, fn: EventListener) {
      target.addEventListener(type, fn)
      cleanups.push(() => target.removeEventListener(type, fn))
    },
    dispose() {
      for (const fn of cleanups.reverse()) fn()
      gsap.globalTimeline.clear()
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        mesh.geometry?.dispose()
        for (const m of ([] as THREE.Material[]).concat(mesh.material ?? [])) m.dispose()
      })
    },
  }
}
export type Scope = ReturnType<typeof createScope>
