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

export type KnowledgePatch = Partial<
  Pick<KnowledgeItem, 'title' | 'content' | 'topic' | 'tags' | 'mastery' | 'pinned'>
>

// 更新知识库
export function updateKnowledge(id: string, patch: KnowledgePatch): KnowledgeItem | null {
  const db = useDatabase()
  const item = db.knowledge.find((k) => k.id === id)
  if (!item) return null

  Object.assign(item, patch)
  item.updatedAt = new Date().toISOString()

  return item
}

// 移除知识库
export function removeKnowledge(id: string): KnowledgeItem | null {
  const db = useDatabase()
  const index = db.knowledge.findIndex((k) => k.id === id)
  if (index === -1) return null

  const [item] = db.knowledge.splice(index, 1)
  return item ?? null
}

// 置顶开关
export function toggleKnowledgePin(id: string): KnowledgeItem | null {
  const db = useDatabase()
  const item = db.knowledge.find((k) => k.id === id)
  if (!item) return null

  item.pinned = !item.pinned
  item.updatedAt = new Date().toISOString()
  return item
}
