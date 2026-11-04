---
paths:
  - "src/scenes/**"
  - "src/kit/**"
---

# three.js r187 and TSL rules for scenes

- Imports: `import * as THREE from 'three/webgpu'`, node functions from `'three/tsl'`, addons from `'three/addons/<path>.js'`. Scene types: `import type { Config, Ctx } from '../runtime'`.
- Shaders are TSL only. `ShaderMaterial` and GLSL do not run on `WebGPURenderer`. Avoid `wgslFn` and `glslFn` (each works on one backend only). Custom functions: `const wave = Fn(([p, k]) => sin(p.mul(k)))`.
- Node materials: `MeshStandardNodeMaterial`, `MeshPhysicalNodeMaterial`, `MeshBasicNodeMaterial`, `PointsNodeMaterial`, `SpriteNodeMaterial`, `LineBasicNodeMaterial`. Slots: `colorNode`, `positionNode`, `normalNode`, `emissiveNode`, `opacityNode`, `roughnessNode`, `metalnessNode`, `fragmentNode` (replaces all shading).
- Time: use `ctx.time` (seconds) and `ctx.phase` (0..1 per loop), never TSL `time`; they pause and loop.
- Renamed in recent releases: `PostProcessing` is `RenderPipeline` (use `ctx.post`), `Clock` is `Timer`, `renderAsync` is deprecated.
- Everyday nodes: `uv() positionLocal positionWorld normalLocal normalWorld screenUV cameraPosition instanceIndex vec2 vec3 vec4 float color mix step smoothstep clamp remap fract abs sin cos pow length distance dot normalize oneMinus select hash texture`. Control flow inside `Fn`: `If`, `Loop`.
- Noise in core: `mx_noise_float`, `mx_noise_vec3`, `mx_fractal_noise_float(p, octaves, lacunarity, diminish, amplitude)`, `mx_worley_noise_float`, `mx_cell_noise_float`. Addons: `tsl/math/curlNoise.js` (`curlNoise`, `snoise`), `tsl/math/voronoiNoise.js` (`voronoi2d`, `voronoi3d`), `tsl/math/Bayer.js` (`bayerDither`), `tsl/utils/Raymarching.js`.
- Post effects (`three/addons/tsl/display/`): `BloomNode.js` `bloom(color, strength, radius, threshold)` (params can be uniforms), `FilmNode.js`, `AfterImageNode.js`, `ChromaticAberrationNode.js`, `RGBShiftNode.js`, `CRT.js`, `lensDirt.js`, `GodraysNode.js`, `DepthOfFieldNode.js`, `GaussianBlurNode.js`, `FXAANode.js`, `SMAANode.js`, `PixelationPassNode.js`, `Lut3DNode.js`, `TransitionNode.js`. Usage: `ctx.post(color => color.add(bloom(color, p.glow, 0.2, 0.7)))`.
- Compute: `const pos = instancedArray(n, 'vec3')`, `const step = Fn(() => { pos.element(instanceIndex).addAssign(...) })().compute(n)`, `ctx.frame(() => ctx.renderer.compute(step))`, then `material.positionNode = pos.toAttribute()` on a `Sprite` or `InstancedMesh` with `count = n`.
- Environment light: `scene.environment = new THREE.PMREMGenerator(ctx.renderer).fromScene(new RoomEnvironment(), 0.04).texture` (`three/addons/environments/RoomEnvironment.js`), or `await load.hdr(url)` from `src/kit/load.ts`.
- GSAP: `gsap.to(p.speed, { value: 3 })`, `gsap.to(mesh.position, { x: 1 })`, colors via `gsap.to(p.tint.value, { r, g, b })`. For a seamless loop, scrub a paused timeline: `ctx.frame(t => tl.time(t % tl.duration()))`. The runtime kills tweens on unload.
- Seamless loops: whole cycles of `ctx.phase` (`sin(ctx.phase.mul(Math.PI * 2 * k))`), and noise sampled on a circle (see the experiment template).
