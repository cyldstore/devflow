export interface SSEUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'usage'; usage: SSEUsage }
  | { type: 'done'; finishReason: string }
  | { type: 'error'; code: string; message: string }

export type ChatPurpose = 'analysis' | 'interview' | 'summary' | 'qa'

export async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)

        const event = parseFrame(frame)
        if (event) yield event

        boundary = buffer.indexOf('\n\n')
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      const event = parseFrame(buffer)
      if (event) yield event
    }
  } finally {
    reader.releaseLock()
  }
}

function parseFrame(frame: string): StreamEvent | null {
  let eventName = 'message'
  const dataLines: string[] = []

  for (const rawLine of frame.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (line.startsWith(':')) continue

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (dataLines.length === 0) return null

  let payload: unknown
  try {
    payload = JSON.parse(dataLines.join('\n'))
  } catch {
    return null
  }

  if (!isRecord(payload)) return null

  if (eventName === 'error' || payload.type === 'error') {
    return {
      type: 'error',
      code: typeof payload.code === 'string' ? payload.code : 'unknown',
      message: typeof payload.message === 'string' ? payload.message : '流式请求失败',
    }
  }

  if (payload.type === 'delta' && typeof payload.text === 'string') {
    return { type: 'delta', text: payload.text }
  }

  if (payload.type === 'usage' && isUsage(payload.usage)) {
    return { type: 'usage', usage: payload.usage }
  }

  if (payload.type === 'done') {
    return {
      type: 'done',
      finishReason: typeof payload.finishReason === 'string' ? payload.finishReason : 'unknown',
    }
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUsage(value: unknown): value is SSEUsage {
  if (!isRecord(value)) return false
  return (
    typeof value.promptTokens === 'number' &&
    typeof value.completionTokens === 'number' &&
    typeof value.totalTokens === 'number'
  )
}
