import type { KnowledgeItem, KnowledgeType } from '@/types'

export type KnowledgeFilter = 'all' | KnowledgeType

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  note: '笔记',
  question: '面试题',
  snippet: '代码片段',
}

// 筛选知识库
export function filterKnowledge(items: KnowledgeItem[], filter: KnowledgeFilter): KnowledgeItem[] {
  if (filter === 'all') return items
  return items.filter((item) => item.type === filter)
}

// 知识库排序
export function sortKnowledge(items: KnowledgeItem[]): KnowledgeItem[] {
  return [...items].sort((a, b) => {
    // 置顶
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
