// Builds the ctx object a scene receives (contract in ./index.ts).
import * as THREE from 'three/webgpu'
import { pass, uniform } from 'three/tsl'
import type GUI from 'lil-gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { renderer } from './stage.ts'
import { createParams } from './params.ts'
import { createInputs } from './inputs.ts'
import { createTimeline } from './timeline.ts'
import { rng } from '../kit/random.ts'
import type { Scope } from './scope.ts'
import type { Config, Ctx } from './index.ts'

type Options = { name: string; config: Config; scene: THREE.Scene; panel: GUI; scope: Scope; seed?: number; changed: () => void }

export function createContext({ name, config, scene, panel, scope, seed, changed }: Options) {
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
  camera.position.set(0, 0, 5)
  const params = createParams(name, panel, changed)
  const inputs = createInputs(panel, changed)
  let pipeline: THREE.RenderPipeline | undefined
  let playhead: (() => number) | undefined
  scope.cleanup(() => pipeline?.dispose())

  const ctx: Ctx = {
    renderer,
    scene,
    camera,
    gui: panel,
    time: uniform(0),
    phase: uniform(0),
    random: seed === undefined ? Math.random : rng(seed),
    params,
    input: inputs.input,
    frame: (fn) => scope.frames.push(fn),
    on: (target, type, fn) => scope.on(target, type, fn as EventListener),
    cleanup: scope.cleanup,
    async timeline(names) {
      const timeline = await createTimeline(name, params.entries, names, config.loop)
      scope.cleanup(timeline.dispose)
      playhead = timeline.position
    },
    post(fn) {
      pipeline = new THREE.RenderPipeline(renderer)
      const scenePass = pass(scene, camera)
      pipeline.outputNode = fn(scenePass.getTextureNode(), scenePass)
    },
    orbit() {
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      scope.frames.unshift(() => controls.update())
      scope.cleanup(() => controls.dispose())
      return controls
    },
  }

  const sceneTime = (t: number) => playhead?.() ?? (config.loop ? t % config.loop : t)
  const render = () => (pipeline ? pipeline.render() : renderer.render(scene, camera))
  return { ctx, inputs, params, render, sceneTime }
}
