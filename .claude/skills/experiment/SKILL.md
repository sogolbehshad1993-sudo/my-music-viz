---
name: experiment
description: Start a new 3D experiment from the designer's idea or sketch with a short brief, a new scene file from the template, the first visible step and a commit. Use when the designer asks for something new rather than a change to the scene on screen.
---

# Start an experiment

1. **Recall.** If the idea may relate to earlier work or the mood board, ask `project-memory-retriever` one focused question.
2. **Brief.** Settle what the designer has not said yet in a single AskUserQuestion call, skipping anything already answered:
   - Where is it shown? Web (fills the window), wall projection or curtain projection (letterboxed 16:9 unless they give an aspect).
   - What kind? Loop (seamless, N seconds), generative (seeded, endless) or reactive (driven by inputs).
   - Inputs? None, mocked channels (name them, such as `energy`, `bass`, `dial1`) or real ones (mic, MIDI, an external feed).
   - Motion? Keyframed by hand in the Theatre timeline, or coded.
3. **Create.** Pick a short kebab-case name. Copy [template.ts](template.ts) to `src/scenes/<name>.ts`, set `config` from the brief, and point `src/current.ts` at it.
4. **First step.** Build the smallest version of the description. Put likely alternatives in the panel as params (AGENTS.md, "Leave room to explore").
5. **Land it.** Verify with the `look` skill (steps 1 and 2), commit `feat(<name>): start <one line>`, and dispatch `project-memory-writer` in the background with the brief.

## Notes per target

- **Wall or curtain projection.** Projectors cannot show black: dark areas glow as a grey rectangle. Keep everything outside the content at pure black, prefer bright forms on black, soften the edges with a vignette and avoid 1 px detail (it shimmers). On fabric, folds favour big, bold shapes. Offer `brightness`, `contrast` and `gamma` params for tuning on site.
- **Loop.** Drive motion from `ctx.phase` in whole cycles so the end meets the start (the template samples noise on a circle).
- **Generative.** Route all randomness through `ctx.random` and set `config.seed`; the panel's "new seed" button explores variations.
- **Reactive.** Declare channels with `ctx.input`, defaulting to a mock source (`lfo` or `noise`) so it moves before any hardware exists.
- **Keyframed.** Declare the params first, then `ctx.timeline(['name', ...])`. The designer sets keys in the studio; when they say save, run `curl -s localhost:5280/__timeline` and commit the JSON it writes.
