// Scene discovery: every src/scenes/<name>.ts or src/scenes/<name>/index.ts is a scene.
import type { SceneModule } from './index.ts'

const modules = import.meta.glob<SceneModule>(['../scenes/*.ts', '../scenes/*/index.ts'])
const paths = Object.fromEntries(Object.keys(modules).map((p) => [p.replace(/^\.\.\/scenes\/|(\/index)?\.ts$/g, ''), p]))

export const names = Object.keys(paths).sort()
export const loadScene = (name: string) => (paths[name] ? modules[paths[name]]() : undefined)
