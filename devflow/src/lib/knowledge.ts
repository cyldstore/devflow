import type { KnowledgeItem, KnowledgeType, Mastery } from '@/types'

export type KnowledgeFilter = 'all' | KnowledgeType
export type MasteryFilter = 'all' | Mastery

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  note: '笔记',
  question: '面试题',
  snippet: '代码片段',
}

export interface KnowledgeQuery {
  type?: KnowledgeFilter
  keyword?: string
  mastery?: MasteryFilter
}

// 筛选知识库
export function filterKnowledge(items: KnowledgeItem[], query: KnowledgeQuery): KnowledgeItem[] {
  const keyword = query.keyword?.trim().toLowerCase() ?? ''
  const type = query.type ?? 'all'
  const mastery = query.mastery ?? 'all'

  return items.filter((item) => {
    if (type !== 'all' && item.type !== type) return false
    if (mastery !== 'all' && item.mastery !== mastery) return false
    if (!keyword) return true

    const haystack = `${item.title} ${item.topic} ${item.tags.join(' ')}`.toLowerCase()
    return haystack.includes(keyword)
  })
}

// 知识库排序
export function sortKnowledge(items: KnowledgeItem[]): KnowledgeItem[] {
  return [...items].sort((a, b) => {
    // 置顶
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
