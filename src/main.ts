// Entry: shows the scene named in src/current.ts (or ?scene=name) and hot-swaps it on every edit.
// Scenes never need to read the runtime; the contract is in src/runtime/index.ts.
import current from './current.ts'
import { url } from './runtime/stage.ts'
import { run } from './runtime/run.ts'

const name = url.get('scene') ?? current
let stop: Promise<() => void>
const start = () => (stop = run(name, restart))
const restart = () => stop.then((s) => (s(), start()))

document.title = name
start()

if (import.meta.hot) {
  import.meta.hot.dispose(() => stop.then((s) => s()))
  import.meta.hot.accept()
}
