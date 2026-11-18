import type { PerfReport } from './perf'

export function sendPerfReport(report: PerfReport): void {
  if (report.metrics.length === 0) return

  const payload = {
    sessionId: report.sessionId,
    route: report.route,
    device: report.device,
    sampleRate: report.sampleRate,
    metrics: report.metrics.map(({ name, value }) => ({ name, value })),
  }

  const body = new Blob([JSON.stringify(payload)], { type: 'text/plain' })
  const url = '/api/vitals'

  if (navigator.sendBeacon?.(url, body)) return

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
    keepalive: true,
  }).catch(() => {})
}
