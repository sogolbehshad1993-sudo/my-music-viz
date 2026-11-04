// Held keys by KeyboardEvent.code: keys.down('KeyW'), keys.axis('KeyA', 'KeyD') -> -1 | 0 | 1.
// For one-off presses use ctx.on(window, 'keydown', e => ...). Runtime hotkeys: F H P R Space.
const held = new Set<string>()
addEventListener('keydown', (e) => held.add(e.code))
addEventListener('keyup', (e) => held.delete(e.code))
addEventListener('blur', () => held.clear())

export const keys = {
  down: (code: string) => held.has(code),
  axis: (negative: string, positive: string) => (held.has(positive) ? 1 : 0) - (held.has(negative) ? 1 : 0),
}
