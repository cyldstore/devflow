import type { Task } from '@/types'
import { formatDate } from './date'

export type TaskGroupKey = 'overdue' | 'today' | 'thisWeek' | 'later' | 'done'

export interface TaskGroup {
  key: TaskGroupKey
  label: string
  tasks: Task[]
}

const GROUP_LABELS: Record<TaskGroupKey, string> = {
  overdue: '逾期',
  today: '今天',
  thisWeek: '本周稍后',
  later: '以后',
  done: '已完成',
}

const GROUP_ORDER: TaskGroupKey[] = ['overdue', 'today', 'thisWeek', 'later', 'done']

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 } as const

export function isOverdue(task: Task, today: string): boolean {
  return !task.done && task.date < today
}

export function endOfWeek(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.getDay() // 0 = 周日
  const offset = weekday === 0 ? 0 : 7 - weekday
  date.setDate(date.getDate() + offset)
  return formatDate(date)
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (byPriority !== 0) return byPriority
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return a.createdAt < b.createdAt ? -1 : 1
  })
}

function sortDone(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

export function groupTasks(tasks: Task[], today: string): TaskGroup[] {
  const weekEnd = endOfWeek(today)

  const buckets: Record<TaskGroupKey, Task[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    done: [],
  }

  for (const task of tasks) {
    if (task.done) buckets.done.push(task)
    else if (task.date < today) buckets.overdue.push(task)
    else if (task.date === today) buckets.today.push(task)
    else if (task.date <= weekEnd) buckets.thisWeek.push(task)
    else buckets.later.push(task)
  }

  return GROUP_ORDER.map((key) => ({
    key,
    label: GROUP_LABELS[key],
    tasks: key === 'done' ? sortDone(buckets[key]) : sortTasks(buckets[key]),
  })).filter((group) => group.tasks.length > 0)
}
