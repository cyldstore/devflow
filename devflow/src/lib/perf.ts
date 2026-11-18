import { createId } from '@/lib/id'

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

type MetricName = 'FP' | 'FCP' | 'LCP' | 'CLS'
type PerfRating = 'good' | 'needs-improvement' | 'poor'

export interface PerfMetric {
  name: MetricName
  value: number
  rating: PerfRating
}

export interface PerfReport {
  sessionId: string
  route: string
  device: 'mobile' | 'desktop'
  sampleRate: number
  metrics: PerfMetric[]
}

interface InitOptions {
  onReport?: (report: PerfReport) => void
}

declare global {
  interface Window {
    __devflowPerf?: {
      report: () => PerfReport
      finalize: () => PerfReport | null
      send: () => void
    }
  }
}

const THRESHOLDS: Record<MetricName, [number, number]> = {
  FP: [1800, 3000],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
}

function ratingOf(name: MetricName, value: number): PerfRating {
  const [good, poor] = THRESHOLDS[name]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

function readSampleRate(): number {
  const raw = Number(import.meta.env.VITE_PERF_SAMPLE_RATE ?? '1')
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 1
}

export function initPerfMonitoring(options: InitOptions = {}): void {
  const sampleRate = readSampleRate()
  if (Math.random() >= sampleRate) return
  if (typeof PerformanceObserver === 'undefined') return

  const supported = PerformanceObserver.supportedEntryTypes ?? []
  const sessionId = createId()
  const route = window.location.pathname
  const device = window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'

  const values = new Map<MetricName, number>()
  const observers: PerformanceObserver[] = []
  let lcpObserver: PerformanceObserver | null = null
  const clsSupported = supported.includes('layout-shift')

  if (supported.includes('paint')) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformancePaintTiming[]) {
        if (entry.name === 'first-paint') values.set('FP', entry.startTime)
        if (entry.name === 'first-contentful-paint') values.set('FCP', entry.startTime)
      }
    })
    observer.observe({ type: 'paint', buffered: true })
    observers.push(observer)
  }

  if (supported.includes('largest-contentful-paint')) {
    lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) values.set('LCP', last.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    observers.push(lcpObserver)
  }

  if (clsSupported) {
    let clsValue = 0
    let sessionValue = 0
    let sessionStart = 0
    let lastEntryTime = 0

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (entry.hadRecentInput) continue

        const gap = entry.startTime - lastEntryTime
        const windowTooLong = entry.startTime - sessionStart > 5000

        if (sessionValue === 0 || gap > 1000 || windowTooLong) {
          sessionStart = entry.startTime
          sessionValue = 0
        }

        sessionValue += entry.value
        lastEntryTime = entry.startTime
        clsValue = Math.max(clsValue, sessionValue)
      }

      values.set('CLS', clsValue)
    })

    observer.observe({ type: 'layout-shift', buffered: true })
    observers.push(observer)
  }

  // LCP 在首次输入后定稿
  const stopLcp = (): void => {
    lcpObserver?.disconnect()
    lcpObserver = null
  }
  window.addEventListener('keydown', stopLcp, { once: true, passive: true })
  window.addEventListener('pointerdown', stopLcp, { once: true, passive: true })

  let finalized = false

  function buildReport(): PerfReport {
    if (clsSupported && !values.has('CLS')) values.set('CLS', 0)

    return {
      sessionId,
      route,
      device,
      sampleRate,
      metrics: [...values.entries()].map(([name, value]) => ({
        name,
        value: name === 'CLS' ? Math.round(value * 1000) / 1000 : Math.round(value),
        rating: ratingOf(name, value),
      })),
    }
  }

  function finalize(): PerfReport | null {
    if (finalized) return null
    finalized = true
    for (const observer of observers) observer.disconnect()
    return buildReport()
  }

  function reportOnce(): void {
    const report = finalize()
    if (report) options.onReport?.(report)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportOnce()
  })
  window.addEventListener('pagehide', reportOnce, { once: true })

  if (import.meta.env.DEV) {
    window.__devflowPerf = {
      report: buildReport,
      finalize,
      send: reportOnce,
    }
  }
}
