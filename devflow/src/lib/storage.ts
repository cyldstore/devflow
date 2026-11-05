const PREFIX = 'devflow'

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}:${key}`)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeJSON(key: string): void {
  try {
    localStorage.removeItem(`${PREFIX}:${key}`)
  } catch {
    // 极少数环境下 removeItem 也会抛错（例如被策略禁用），忽略即可
  }
}
