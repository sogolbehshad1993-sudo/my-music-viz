# Lessons

Technical lessons and gotchas, one per bullet, dated.

- 2026-11-04: The playground runs on port 5280 (`strictPort`) because 5173, Vite's default, is often taken by other projects.
- 2026-11-04: three r187 renamed `PostProcessing` to `RenderPipeline` and `Clock` to `Timer`. `ShaderMaterial` (GLSL) does not work on `WebGPURenderer`; write shaders in TSL.
- 2026-11-04: Headless Chrome on macOS gets real WebGPU (Metal) without flags, but its frame rate is not meaningful; check performance with `?debug` in a real browser window.
- 2026-11-04: WebGPU canvases must be read in the same task as the render, so screenshots are taken from the frame loop (`runtime/grab.ts`).
