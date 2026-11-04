---
name: look
description: Check what the playground is showing, cheapest first, using type errors, the page console, the values dialed into the panel, a frame from the designer's open browser, or a headless render when no browser is open. Use after a change, when something looks wrong, or when the designer asks what you see.
---

# Look

Stop as soon as you know enough.

1. `npm run -s check` for type errors.
2. `tail -20 .playground/log.txt`, the page console. A healthy load logs `scene "<name>" running on webgpu`. Runtime errors also show at the bottom left of the page.
3. `cat .playground/state.json` for the scene, seed, params and inputs as the designer has them right now.
4. `curl -s localhost:5280/__shot`, then Read `.playground/shot.jpg`. It is an 800 px frame from the designer's own browser, in its current state.
5. If step 4 says no page answered, render headless: `agent-browser open 'http://localhost:5280/?scene=<name>&ui=0'`, `agent-browser set viewport 800 450`, repeat step 4, then `agent-browser close`.

- Performance: ask the designer to open `?debug` (the three.js Inspector shows fps and GPU time). Headless frame rates mean nothing.
- Dev server down: run `scripts/dev.sh`.
