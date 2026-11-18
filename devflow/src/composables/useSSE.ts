import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'
import { readSSE, type SSEUsage } from '@/lib/ai/sse'

export interface UseSSEOptions {
  url: string
  body: unknown
  maxRetries?: number
  retryDelayMs?: number
  onDelta?: (text: string) => void
  onUsage?: (usage: SSEUsage) => void
  onDone?: (finishReason: string) => void
  onError?: (message: string) => void
}

export interface UseSSEReturn {
  text: Ref<string>
  isStreaming: Ref<boolean>
  error: Ref<string | null>
  firstTokenMs: Ref<number | null>
  isRetrying: Ref<boolean>
  start: (bodyOverride?: unknown) => Promise<void>
  stop: () => void
}

class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const text = ref('')
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  const firstTokenMs = ref<number | null>(null)
  const isRetrying = ref(false)

  let controller: AbortController | null = null
  let stoppedByUser = false

  // 用户主动暂停
  function stop(): void {
    stoppedByUser = true
    controller?.abort()
    controller = null
    isStreaming.value = false
    isRetrying.value = false
  }

  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  async function start(bodyOverride?: unknown): Promise<void> {
    if (isStreaming.value) return

    stoppedByUser = false
    isStreaming.value = true
    error.value = null
    text.value = ''
    firstTokenMs.value = null
    isRetrying.value = false

    const maxRetries = options.maxRetries ?? 2
    const retryDelayMs = options.retryDelayMs ?? 600

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      controller = new AbortController()
      const startedAt = performance.now()

      try {
        const response = await fetch(options.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyOverride ?? options.body),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new HttpError(await readErrorMessage(response), response.status)
        }
        if (!response.body) {
          throw new Error('服务端没有返回流')
        }
        let sawDone = false

        for await (const event of readSSE(response.body)) {
          if (event.type === 'delta') {
            if (firstTokenMs.value === null) {
              firstTokenMs.value = Math.round(performance.now() - startedAt)
            }
            text.value += event.text
            options.onDelta?.(event.text)
          } else if (event.type === 'usage') {
            options.onUsage?.(event.usage)
          } else if (event.type === 'done') {
            sawDone = true
            options.onDone?.(event.finishReason)
            break
          } else {
            throw new Error(event.message)
          }
        }

        if (!sawDone) {
          throw new Error('连接提前结束，分析可能不完整')
        }

        isStreaming.value = false
        controller = null
        return
      } catch (err) {
        controller = null

        if (stoppedByUser || isAbortError(err)) {
          isStreaming.value = false
          return
        }

        const message = toErrorMessage(err)
        // 没有收到任何正文时才运行重试
        const canRetry = attempt < maxRetries && text.value.length === 0 && isRetryable(err)

        if (!canRetry) {
          error.value = message
          options.onError?.(message)
          isStreaming.value = false
          return
        }

        isRetrying.value = true
        await delay(retryDelayMs * 2 ** attempt)
        isRetrying.value = false
        if (stoppedByUser) {
          isStreaming.value = false
          return
        }
      }
    }

    isStreaming.value = false
  }

  return { text, isStreaming, error, firstTokenMs, start, stop, isRetrying }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown }
    if (typeof data.error === 'string') return data.error
  } catch {}
  return `请求失败（${response.status}）`
}

// 是否允许重试
function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) {
    return err.status === 429 || err.status >= 500
  }
  return !isAbortError(err)
}

function isAbortError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError'
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toErrorMessage(err: unknown): string {
  if (err instanceof HttpError) return err.message

  if (err instanceof Error) {
    if (err.name === 'TypeError') {
      return '网络连接失败，请检查后端是否启动'
    }
    return err.message
  }

  return '请求失败'
}
