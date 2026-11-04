// The scene contract. Scenes import these types only: `import type { Ctx, Config } from '../runtime'`.
import type * as THREE from 'three/webgpu'
import type GUI from 'lil-gui'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Params, ParamDef } from './params.ts'
import type { InputOptions } from './inputs.ts'

export type Config = {
  /** Where it is shown. 'wall' and 'curtain' default to a letterboxed 16:9 frame. */
  output?: 'web' | 'wall' | 'curtain'
  /** Lock the frame to width / height, letterboxed in black. */
  aspect?: number
  /** Loop length in seconds: ctx.time wraps and ctx.phase runs 0..1 (also the timeline's loop range). */
  loop?: number
  /** Seed for ctx.random (generative pieces). Adds a seed row and a "new seed" button. */
  seed?: number
  /** Background color, black by default. */
  background?: string
}

export type Ctx = {
  renderer: THREE.WebGPURenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  /** This scene's panel (lil-gui). Prefer ctx.params for values. */
  gui: GUI
  /** Scene time in seconds as a TSL uniform. Use it instead of TSL `time` (it pauses, loops and records). */
  time: THREE.UniformNode<'float'>
  /** 0..1 through the loop when config.loop is set. */
  phase: THREE.UniformNode<'float'>
  /** Seeded random in [0, 1) when config.seed is set, Math.random otherwise. */
  random: () => number
  /** Declare tweakable values: each becomes a uniform and a panel row. See runtime/params.ts. */
  params: <const T extends Record<string, ParamDef>>(defs: T) => Params<T>
  /** A 0..1 input channel (mocked in the panel first, real later). See runtime/inputs.ts. */
  input: (name: string, options?: InputOptions) => THREE.UniformNode<'float'>
  /** Keyframe these params (by name) in the Theatre.js studio; ctx.time then follows its playhead. See runtime/timeline.ts. */
  timeline: (names: string[]) => Promise<void>
  /** Run every frame with scene time t (wrapped when looping) and delta dt, both in seconds. */
  frame: (fn: (t: number, dt: number) => void) => void
  /** Post-processing: return the final color node, e.g. color => color.add(bloom(color)). */
  post: (fn: (color: THREE.TextureNode, scenePass: THREE.PassNode) => THREE.Node) => void
  /** Orbit controls with damping, updated and disposed for you. */
  orbit: () => OrbitControls
  /** addEventListener that is removed when the scene unloads. */
  on: <K extends keyof WindowEventMap>(target: EventTarget, type: K | string, fn: (e: WindowEventMap[K]) => void) => void
  /** Extra cleanup when the scene unloads (meshes, materials, tweens and listeners are already handled). */
  cleanup: (fn: () => void) => void
}

export type SceneModule = {
  default: (ctx: Ctx) => void | (() => void) | Promise<void | (() => void)>
  config?: Config
}
