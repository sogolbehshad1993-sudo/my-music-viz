// Browser storage for panel state (per machine, never committed).
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`pg:${key}`)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`pg:${key}`, JSON.stringify(value))
    } catch {}
  },
}

// A value the designer changed wins over its default, until the default in code changes.
export function remembered(key: string, def: unknown) {
  const saved = store.get<{ d: unknown; v: unknown } | null>(key, null)
  const same = saved !== null && JSON.stringify(saved.d) === JSON.stringify(def)
  return {
    prior: same ? saved.v : undefined,
    save: (v: unknown) => store.set(key, { d: def, v }),
  }
}
