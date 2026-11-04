# 3D Playground

A fullscreen black canvas where a designer (an ideator, not a coder) and the agent build 3D experiments together, step by step, from talk and sketches. Stack: Vite 8, TypeScript 7, three.js r187 (`WebGPURenderer`, TSL shaders), lil-gui, GSAP, Theatre.js. Desktop only: no mobile work.

## Working with the designer

- They describe, you build exactly that, one small step at a time. Each step should show up in their open browser within seconds (hot reload, no page refresh).
- Leave room to explore. Build what was described, then put the alternatives you suspect they might prefer into the panel instead of choosing silently: a `style` dropdown, a toggle, wider slider ranges, an extra color. New visible scene elements they did not ask for are not allowed; alternatives live in the panel.
- When there is a real choice between paths (approach, library, look, structure), ask with AskUserQuestion: 2 to 4 options, your recommendation first, previews (ASCII layouts or code) when comparing. Do not ask about things with a sensible default; pick it and say so.
- Everything they dial in is captured live in `.playground/state.json` (scene, params, inputs, seed). When they say "keep this" or "I like it like that", read it, bake the values into the scene defaults and commit.
- Sketches, links and references they share go on the mood board (`npm run -s mood`, see the `sources` skill).
- Never write em dashes, anywhere. Use a colon, a comma or parentheses.

## Session start

- A SessionStart hook starts the dev server at http://localhost:5280 (it opens the browser) and prints what is on screen. Do not start another one.
- Read `memory/preferences.md`. For anything older (past ideas, experiments, why something changed) use the `project-memory-retriever` subagent rather than reading all of `memory/`.

## Map: read only what the step needs

```
src/scenes/<name>.ts    one experiment per file (a <name>/ folder with index.ts once it needs splitting)
src/current.ts          the scene on screen: export default '<name>'
src/kit/                small utils for scenes: keys, pointer (+ pointer lock, raycast), random, load
src/runtime/            the frozen engine. Do not read or edit it for scene work.
memory/                 preferences, ideas, experiments, lessons, mood board
scripts/                dev.sh (session hook), vite-bridge.ts (agent endpoints), mood.ts (mood board CLI)
.claude/rules/tsl.md    three r187 + TSL rules, loaded automatically when you edit scenes
.claude/skills/         experiment, step, look, sources
```

## Scene contract (full types: `src/runtime/index.ts`)

```ts
export const config: Config = { output: 'web' | 'wall' | 'curtain', aspect?, loop?: seconds, seed?, background? }
export default (ctx: Ctx) => { /* may be async, may return a cleanup */ }
```

- `ctx.params({ speed: [1, 0, 5], tint: '#ff3366', glow: true, style: ['soft', 'hard'], burst: () => {} })`: each entry is a value, a TSL uniform and a panel row in one line.
- `ctx.input('energy', { source: 'lfo' })`: a 0..1 channel. Mocked in the panel first (slider, lfo, noise), real later (mic, midi, external) with no scene change.
- `ctx.timeline(['speed', 'glow'])`: keyframe those params in Theatre.js studio.
- `ctx.time` and `ctx.phase` are TSL uniforms; use them instead of TSL `time` (they pause and loop).
- Also: `ctx.frame(fn)`, `ctx.post(color => ...)`, `ctx.orbit()`, `ctx.on(target, type, fn)`, `ctx.cleanup(fn)`, `ctx.random()`, `ctx.scene`, `ctx.camera`, `ctx.gui`.
- The runtime disposes meshes, materials, tweens, listeners and controls when a scene unloads.

## Code rules

- Very simple code. Files stay small: aim under 100 lines, hard limit 150. Split by responsibility (SOLID), keep the simplest thing that works (KISS), and never duplicate logic (DRY): a helper used twice moves to `src/kit/`.
- Edit with small, targeted edits. Never rewrite a file to change a few lines, and do not re-read a file you just wrote.
- Do not read `node_modules/three`. The TSL rule file has what you need; if unsure, grep for the one symbol.

## Verify cheaply, in this order

1. `npm run -s check` (types, fast).
2. `tail -20 .playground/log.txt`: the page's console. A healthy load logs `scene "<name>" running on webgpu`.
3. Only when you must see it: `curl -s localhost:5280/__shot`, then Read `.playground/shot.jpg` (about 500 tokens). The designer is watching the screen, so do not screenshot to show them things.

Never run `npm run build` during a session. Details: the `look` skill.

## Steps and commits

- Commits are pre-approved in this repo. Commit each visible step as soon as it type-checks and runs: `feat(<scene>): <what changed>` (Angular style), memory changes included.
- Undo means `git revert` (a new commit). Never reset, amend or rewrite history; nothing they saw is ever lost. Push only when asked.
- No AI attribution or co-author lines in commit messages.
- Undo, restore, A/B compare and favourites: the `step` skill.

## Memory

- `memory/` is this playground's memory and is committed with the work. Format rules: `memory/README.md`.
- When a step lands, or the designer states a preference, an idea or a rejection, dispatch `project-memory-writer` in the background with the facts and their own words. It never commits; your next commit picks its changes up.

## Hotkeys and URLs (mention them when useful)

F fullscreen, H hide panels and cursor, Space pause, P save a PNG to Downloads.
`?scene=<name>`, `?ui=0` (no panels), `?debug` (three.js Inspector: fps, GPU time), `?webgl` (force the WebGL2 fallback).
External inputs: `curl -s 'localhost:5280/__input?energy=0.8'`. Save keyframes: `curl -s localhost:5280/__timeline`.
