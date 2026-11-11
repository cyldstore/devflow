export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) // 有没有协议
  const candidate = hasScheme ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    // 只放行http和https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
