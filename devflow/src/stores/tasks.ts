import type { Task } from '@/types'
import { localDate } from '@/lib/date'
import { createId } from '@/lib/id'
import { useDatabase } from './db'

export interface RemovedTask {
  task: Task
  index: number
}

// 添加任务
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

// 移除任务
export function removeTask(id: string): RemovedTask | null {
  const db = useDatabase()
  const index = db.tasks.findIndex((t) => t.id === id)
  if (index === -1) return null

  const [task] = db.tasks.splice(index, 1)
  if (!task) return null

  return { task, index }
}

// 撤销移除
export function restoreTask(removed: RemovedTask): void {
  const db = useDatabase()
  const index = Math.min(removed.index, db.tasks.length)
  db.tasks.splice(index, 0, removed.task)
}

// 可编辑字段
export type TaskEditable = Pick<
  Task,
  'title' | 'note' | 'date' | 'category' | 'priority' | 'estimateMin'
>

// 编辑字段
export function updateTask(id: string, patch: Partial<TaskEditable>): Task | null {
  const db = useDatabase()
  const task = db.tasks.find((t) => t.id === id)
  if (!task) return null

  Object.assign(task, patch)
  task.updatedAt = new Date().toISOString()

  return task
}

// 日期更新
export function rescheduleTask(id: string, date: string): Task | null {
  const db = useDatabase()
  const task = db.tasks.find((item) => item.id === id)
  if (!task) return null

  task.date = date
  task.updatedAt = new Date().toISOString()
  return task
}
