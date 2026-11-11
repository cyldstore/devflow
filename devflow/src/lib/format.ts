export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0 分钟'

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest} 分钟`
  if (rest === 0) return `${hours} 小时`
  return `${hours} 小时 ${rest} 分`
}
