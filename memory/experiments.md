# Experiments

One section per experiment, newest first. Template:

```
## <name>  (started YYYY-MM-DD, status: active | parked | done)
- Shown on: web | wall | curtain (aspect)
- Kind: loop (N s) | generative (seed) | reactive (inputs)
- Inputs: which channels, mocked or real
- Idea: the description, in the designer's words where it matters
- Decisions: what we chose and why
- Favourites: commit hashes or tags the designer liked
```

## resonance  (started 2026-11-04, status: active)
- Scene: `src/scenes/resonance/`, commit 06df52b. Ported from her approved web build `resonance-web/template.html` (untracked, her own source).
- Shown on: wall, 16:9 (projector frame 1280x720)
- Kind: reactive
- Inputs: `ctx.input` channels love, desire, wonder, joy, sorrow, anger, fear, disgust (0..1 = knob 0..100), mocked as sliders until Arash's real knobs arrive; plus `music` (0..1). Opening state: Love 45, Sorrow 40.
- Body: stipple, 82,887 points (`public/assets/resonance/body.json`), How We Feel look: dim front, bright rim, back half 0.22.
- Places and colours (palette B): Wonder #07DCE1, Anger #FD325C, Disgust #18DD7D, Fear #7577FC, Love #FF45D8, Sorrow #0047AB (cobalt), Desire #FE8602, Joy #D9F124 (no place, runs along the outline). Her colours must not be changed.
- Lines (Love.32 colours and shapes): Wonder rays, Fear broken and shivering, Desire spiral, Disgust staircase glitch, Sorrow curl falling, Anger zigzags from forehead and fists, Love chest scribble plus hoops, Joy outline loops.
- Births: 5 body grains gather into one drop over 3.5 s. Sway 0.5 rad over 24 s. Life slowed to 0.3.
- Her binding rules (28 Sep deck): knob value = number of lines, every 5 = 1 line (10 = 2, 20 = 4); all knobs at 100 = THE VOID; each line ends in a text from Alireza (later).
- Left out on purpose: the WOW body switch and haze.
- Open: `nLines()` in `emotions.ts` is a TODO(human) for her to write; the void, the text endings and the music bridge are not ported yet.
