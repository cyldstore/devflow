import type { ResumeParseRequest, ResumeParseResponse } from './protocol'

type Result = Extract<ResumeParseResponse, { ok: true }>
type Pending = { resolve: (value: Result) => void; reject: (error: Error) => void }

export function createResumeParser() {
  const worker = new Worker(new URL('../workers/resume-parse.worker.ts', import.meta.url), {
    type: 'module',
  })

  const pending = new Map<string, Pending>()
  let seq = 0

  worker.onmessage = (event: MessageEvent<ResumeParseResponse>) => {
    const response = event.data
    const item = pending.get(response.id)
    if (!item) return
    pending.delete(response.id)

    if (response.ok) item.resolve(response)
    else item.reject(new Error(response.message))
  }

  worker.onerror = (event) => {
    const error = new Error(event.message ? `解析线程异常：${event.message}` : '解析线程异常')
    for (const item of pending.values()) item.reject(error)
    pending.clear()
  }

  return {
    parse(file: File): Promise<Result> {
      const id = `resume-${++seq}`
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        const request: ResumeParseRequest = { id, file }
        worker.postMessage(request)
      })
    },
    dispose(): void {
      const error = new Error('简历解析已取消')
      for (const item of pending.values()) item.reject(error)
      pending.clear()
      worker.terminate()
    },
  }
}
