// What every emotion's line provides. Ported 1:1 from her web build (itself translated from the Love.32 GLSL line shaders).
import type { V } from '../math.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Model = any // each emotion keeps its own shape data

export type Kind = {
  /** once per line: its shape, from the slot, a seed L and where it is born */
  build(slot: number, L: number, src: V): Model
  /** the point at s (0..1 along the line), at time tm, with music mus */
  pos(m: Model, s: number, tm: number, mus: number): V
  /** 1 = drawn, 0 = a gap (Fear's broken pieces, Disgust's dashes) */
  mask?(m: Model, s: number, tm: number): number
  /** dimming where the line passes behind the body (Love's hoops) */
  vis?(m: Model, s: number, tm: number): number
  /** the colour-split ghost offset beside the line (Disgust) */
  ghost?(m: Model, s: number, tm: number): V
}
