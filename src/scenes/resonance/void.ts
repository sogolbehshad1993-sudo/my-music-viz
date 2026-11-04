// THE VOID (her rule): every knob at 95 or more for 3 s. Every point and line turns WHITE at once (0.3 s), then everything
// EXPLODES outward, the streaks fade, only the dark shade of the body stays. When the knobs come down it returns slowly.
import { boom, ease } from './math.ts'

export type VoidState = { hv: number; rising: boolean; white: number; burst: number; fade: number; dark: number }

export function makeVoid() {
  let hold = 0, peak = 0
  return (full: boolean, dt: number): VoidState => {
    hold = full ? Math.min(hold + dt, 8) : Math.max(hold - dt * 0.6, 0)
    if (full) peak = Math.max(peak, hold)
    else if (hold <= 0) peak = 0
    const hv = hold, rising = full
    return {
      hv,
      rising,
      white: rising ? ease((hv - 2.5) / 0.3) : 0, // sudden
      burst: rising ? boom((hv - 3.1) / 2.6) : peak > 3.1 ? 1 : 0, // the burst does not fly back
      fade: rising ? 1 - ease((hv - 4.2) / 2.2) : 0, // the flying streaks fade
      dark: rising ? ease((hv - 4.6) / 1.8) : ease(hv / Math.max(peak, 0.01)) * (peak > 3.1 ? 1 : 0), // returns as the knobs come down
    }
  }
}
