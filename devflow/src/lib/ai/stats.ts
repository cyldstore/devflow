export interface ChatStatsByModel {
  model: string
  requests: number
  totalTokens: number
  firstTokenP75: number | null
}

export interface ChatStats {
  days: number
  requests: number
  cachedRequests: number
  cacheHitRate: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  firstTokenP75: number | null
  avgTotalMs: number | null
  byModel: ChatStatsByModel[]
}

export async function fetchChatStats(days: 7 | 30): Promise<ChatStats> {
  let response: Response

  try {
    response = await fetch(`/api/stats?days=${days}`)
  } catch {
    throw new Error('AI 服务未启动，统计数据不可用')
  }

  if (!response.ok) {
    throw new Error(`统计接口失败（${response.status}）`)
  }

  return (await response.json()) as ChatStats
}
