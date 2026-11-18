export function estimateTokens(text: string): number {
  const chinese = (text.match(/[\u4e00-\u9fff]/g) ?? []).length
  const rest = text.length - chinese
  return Math.ceil(chinese + rest / 4)
}

export function estimateMessagesTokens(messages: { content: string }[]): number {
  return messages.reduce((sum, message) => sum + estimateTokens(message.content) + 4, 0)
}

export interface TruncateResult {
  text: string
  truncated: boolean
}

export function truncateToTokens(text: string, maxTokens: number): TruncateResult {
  const total = estimateTokens(text)
  if (total <= maxTokens) {
    return { text, truncated: false }
  }

  let cut = text.slice(0, Math.max(0, Math.floor(text.length * (maxTokens / total))))

  while (cut.length > 0 && estimateTokens(cut) > maxTokens) {
    cut = cut.slice(0, Math.floor(cut.length * 0.9))
  }

  return { text: cut.trimEnd(), truncated: true }
}
