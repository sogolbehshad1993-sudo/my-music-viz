// Seeded random for generative pieces: const r = rng(42); r() -> [0, 1). Same seed, same piece.
export function rng(seed: number) {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const range = (min: number, max: number, r = Math.random) => min + (max - min) * r()
export const pick = <T>(list: readonly T[], r = Math.random) => list[Math.floor(r() * list.length)]
export const chance = (p: number, r = Math.random) => r() < p
