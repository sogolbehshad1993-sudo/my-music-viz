# 3D Playground

A fullscreen black canvas for designing 3D experiments step by step with an AI coding agent. You describe or sketch, the agent builds one small step at a time, and every step shows up live in the browser and lands as a git commit you can undo.

Built on Vite, TypeScript, three.js (`WebGPURenderer` with TSL shaders and a WebGL2 fallback), lil-gui, GSAP and Theatre.js. Desktop browsers only.

## Start

```sh
npm install
npm run dev      # http://localhost:5280
```

With Claude Code, just open the folder: a session hook starts the dev server and opens the browser. `AGENTS.md` holds the working rules, and `.claude/` holds the skills (`experiment`, `step`, `look`, `sources`), the memory subagents and the TSL rules.

## In the browser

| Key | Does |
| --- | --- |
| F | fullscreen |
| H | hide panels and cursor |
| Space | pause |
| P | save a PNG |

URL options: `?scene=<name>`, `?ui=0`, `?debug` (three.js Inspector with fps and GPU time), `?webgl` (force WebGL2).

## How a scene looks

```ts
import * as THREE from 'three/webgpu'
import { mix, sin, positionLocal } from 'three/tsl'
import type { Config, Ctx } from '../runtime'

export const config: Config = { output: 'web', loop: 8 }

export default (ctx: Ctx) => {
  const p = ctx.params({ speed: [1, 0, 4], a: '#ff3366', b: '#33ccff' }) // values, uniforms and panel rows
  const energy = ctx.input('energy', { source: 'lfo' })                   // mock now, MIDI or mic later
  const mat = new THREE.MeshStandardNodeMaterial()
  mat.colorNode = mix(p.a, p.b, sin(positionLocal.y.mul(4).add(ctx.time.mul(p.speed))).mul(energy))
  ctx.scene.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 32), mat), new THREE.HemisphereLight())
  ctx.orbit()
}
```

Scenes live in `src/scenes/`, one file each. `src/current.ts` names the one on screen.

## Agent loop helpers (dev server only)

- `.playground/log.txt` and `.playground/state.json`: the page's console, and the values dialed into the panel.
- `curl -s localhost:5280/__shot`: a frame from the open page, saved to `.playground/shot.jpg`.
- `curl -s 'localhost:5280/__input?energy=0.8'`: feed an external input.
- `curl -s localhost:5280/__timeline`: save Theatre keyframes to `src/scenes/<scene>.timeline.json`.
- `npm run -s mood -- help`: the mood board in `memory/moodboard/`.

## Licences

Code: MIT. Theatre.js studio (AGPL-3.0) is a dev dependency loaded only in the dev server; `@theatre/core` is Apache-2.0. Check each asset's licence before adding it to `public/assets/` and credit it in `public/assets/CREDITS.md`.
