import type { KnowledgeItem, KnowledgeType, Mastery } from '@/types'
import { createId } from '@/lib/id'
import { useDatabase } from './db'

export interface KnowledgeInput {
  type: KnowledgeType
  title: string
  content: string
  topic: string
  tags: string[]
  mastery?: Mastery
}

// 创建知识库
export function createKnowledge(input: KnowledgeInput): KnowledgeItem | null {
  const title = input.title.trim()
  const topic = input.topic.trim()
  if (!title || !topic) return null

  const now = new Date().toISOString()
  const item: KnowledgeItem = {
    id: createId(),
    type: input.type,
    title,
    content: input.content,
    topic,
    tags: input.tags,
    mastery: input.mastery,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }

  useDatabase().knowledge.push(item)
  return item
}
