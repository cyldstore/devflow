import type { Task } from '@/types'
import { localDate } from '@/lib/date'
import { createId } from '@/lib/id'
import { useDatabase } from './db'

export function addTask(title: string): Task | null {
  const trimmed = title.trim()
  if (!trimmed) return null

  const now = new Date().toISOString()
  const task: Task = {
    id: createId(),
    title: trimmed,
    date: localDate(),
    category: 'project',
    priority: 'P2',
    done: false,
    createdAt: now,
    updatedAt: now,
  }

  useDatabase().tasks.push(task)
  return task
}
