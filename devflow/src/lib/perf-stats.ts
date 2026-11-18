export type VitalName = 'FP' | 'FCP' | 'LCP' | 'CLS'
export type VitalRating = 'good' | 'needs-improvement' | 'poor'

export interface VitalMetricStats {
  samples: number
  p50: number | null
  p75: number | null
  p95: number | null
  good: number
  needsImprovement: number
  poor: number
}

export interface VitalsStats {
  days: number
  sessions: number
  totalSamples: number
  metrics: Record<VitalName, VitalMetricStats>
}

const THRESHOLDS: Record<VitalName, [number, number]> = {
  FP: [1800, 3000],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
}

export function ratingOf(name: VitalName, value: number): VitalRating {
  const [good, poor] = THRESHOLDS[name]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

export async function fetchVitalsStats(days: 7 | 30): Promise<VitalsStats> {
  let response: Response

  try {
    response = await fetch(`/api/stats/vitals?days=${days}`)
  } catch {
    throw new Error('统计服务未启动，性能数据不可用')
  }

  if (!response.ok) {
    throw new Error(`性能统计接口失败（${response.status}）`)
  }

  return (await response.json()) as VitalsStats
}
