// Runs one scene: load it, build its ctx, start the frame loop. Returns a stop function.
import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { backend, clock, fit, renderer } from './stage.ts'
import { log, pickScene, report, showError } from './bridge.ts'
import { createPanel } from './ui.ts'
import { remembered } from './store.ts'
import { createScope } from './scope.ts'
import { createContext } from './context.ts'
import { flushGrabs } from './grab.ts'
import { loadScene, names } from './scenes.ts'

gsap.ticker.remove(gsap.updateRoot) // GSAP follows the playground clock (pause, recording)

export async function run(name: string, restart: () => void) {
  showError(null)
  let running = true
  const scene = new THREE.Scene()
  const scope = createScope(scene)
  const panel = createPanel(name)
  const stop = () => {
    running = false
    renderer.setAnimationLoop(null)
    scope.dispose()
    panel.destroy()
  }
  if (names.length > 1) panel.add({ scene: name }, 'scene', names).onChange(pickScene)

  const mod = await loadScene(name)
  if (!mod) return showError(`No scene "${name}". Scenes: ${names.join(', ')}`), stop
  if (!running) return stop
  const config = mod.config ?? {}
  scene.background = new THREE.Color(config.background ?? '#000')

  const seedMemo = remembered(`seed:${name}`, config.seed)
  const seed = (seedMemo.prior as number | undefined) ?? config.seed
  if (seed !== undefined) {
    const row = { seed, 'new seed': () => (seedMemo.save(Math.floor(Math.random() * 1e6)), restart()) }
    panel.add(row, 'seed').onFinishChange((v: number) => (seedMemo.save(v), restart()))
    panel.add(row, 'new seed')
  }

  const state = () => ({ scene: name, backend, seed, paused: clock.paused, params: params.values, inputs: inputs.values() })
  const { ctx, inputs, params, render, sceneTime } = createContext({ name, config, scene, panel, scope, seed, changed: () => report(state) })
  const aspect = config.aspect ?? (config.output === 'wall' || config.output === 'curtain' ? 16 / 9 : undefined)
  fit(aspect, (w, h) => ((ctx.camera.aspect = w / h), ctx.camera.updateProjectionMatrix()))
  clock.t = 0

  try {
    const result = await mod.default(ctx)
    if (typeof result === 'function') scope.cleanup(result)
  } catch (error) {
    return showError(error), stop
  }
  if (!running) return stop
  if (panel.controllersRecursive().length === 0) panel.hide()
  log('info', `scene "${name}" running on ${backend}`)

  renderer.setAnimationLoop(() => {
    try {
      const dt = clock.step()
      const t = sceneTime(clock.t)
      ctx.time.value = t
      ctx.phase.value = config.loop ? t / config.loop : 0
      gsap.updateRoot(clock.engine)
      inputs.update(clock.engine)
      for (const fn of scope.frames) fn(t, dt)
      render()
      flushGrabs()
    } catch (error) {
      renderer.setAnimationLoop(null)
      showError(error)
    }
  })
  return stop
}
