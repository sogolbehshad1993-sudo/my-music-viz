---
name: sources
description: Inspiration and starting points, including the mood board CLI, shader sources that port to TSL, and free 3D models, textures and HDRIs with their licences, plus how to bring them into a scene with credits. Use when the designer shares a reference, asks for inspiration, or a scene needs a model, texture, HDRI or shader to start from.
---

# Sources

## Mood board (`memory/moodboard/`)

Every reference the designer shares goes here, with a date, description and tags. `npm run -s mood -- help` shows all commands:

- `npm run -s mood -- add image ./ref.jpg --title "Wet asphalt" --desc "reflections we liked" --tags light,night` copies local files into `media/` (10 MB max; larger media goes in as a link).
- `list`, `search <words>`, `show <id>`, `pick 3 --tag fog` (random picks to spark ideas), `use <id> <scene>`, `deprecate <id> <reason>`, `restore <id>`.
- Kinds: link, video, image, sketch, text, asset, shader, color, audio.

## Shaders (port to TSL `Fn`; licences checked 2026-11)

1. three.js examples, MIT: the `webgpu_tsl_*`, `webgpu_compute_*` and `webgpu_postprocessing_*` examples at https://threejs.org/examples/ (source in `node_modules/three/examples/`). Closest to working code.
2. `tsl-textures` (npm, MIT): procedural TSL textures. Test against the installed three version before relying on it.
3. Inigo Quilez articles (https://iquilezles.org/articles/): SDFs and noise. The code snippets are MIT; his shader art is not.
4. Shadertoy: CC BY-NC-SA 3.0 unless the author says otherwise, so credit the author and keep it non-commercial. three ships a GLSL-to-TSL transpiler (see the `webgpu_shadertoy` example); hand ports are often cleaner.
5. LYGIA: Prosperity licence (non-commercial, or a paid Patron licence); WGSL only, so port the idea, not the file.
6. The Book of Shaders: all rights reserved; learn from it, do not copy code.

## Free assets

| Source | Licence | Gives |
| --- | --- | --- |
| [Poly Haven](https://polyhaven.com) | CC0 | models (glTF), HDRIs, textures |
| [ambientCG](https://ambientcg.com) | CC0 | PBR textures |
| [Kenney](https://kenney.nl/assets) | CC0 | stylised model packs |
| [Poly Pizza](https://poly.pizza) | CC0 or CC-BY per model | low-poly GLB |
| [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) | per model | reference glTF |
| [Sketchfab](https://sketchfab.com) | per model | glTF downloads |

- Put files in `public/assets/` and load them with `load` from `src/kit/load.ts` (`load.gltf`, `load.texture`, `load.hdr`).
- Shrink models before committing: `npx @gltf-transform/cli@4.5.1 optimize in.glb public/assets/out.glb --compress meshopt --texture-compress webp`.
- Add one line per asset to `public/assets/CREDITS.md`: file, source URL, author, licence.
- If a Blender MCP server is connected, it can search and import from Poly Haven, Sketchfab and Poly Pizza and export GLB for the playground.
