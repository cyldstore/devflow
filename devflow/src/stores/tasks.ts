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

export function toggleTask(id: string): Task | null {
  const db = useDatabase()
  const task = db.tasks.find((t) => t.id === id)
  if (!task) return null

  const now = new Date().toISOString()
  task.done = !task.done
  task.completedAt = task.done ? now : undefined
  task.updatedAt = now

  return task
}
