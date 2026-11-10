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

// 是否逾期
export function isOverdue(task: Task, today: string): boolean {
  return !task.done && task.date < today
}

// 计算本周（周一 ~ 周日）最后一天日期
export function endOfWeek(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.getDay() // 0 = 周日
  const offset = weekday === 0 ? 0 : 7 - weekday // 本周还剩几天
  date.setDate(date.getDate() + offset)
  return formatDate(date)
}

// 任务排序
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    // 按优先级排序
    if (byPriority !== 0) return byPriority
    // 按日期排序
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    // 按创建日期排序
    return a.createdAt < b.createdAt ? -1 : 1
  })
}

// 按完成时间降序排序
function sortDone(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

// 任务按标签分组
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
    // 已完成
    if (task.done) buckets.done.push(task)
    // 逾期
    else if (task.date < today) buckets.overdue.push(task)
    // 今天
    else if (task.date === today) buckets.today.push(task)
    // 本周
    else if (task.date <= weekEnd) buckets.thisWeek.push(task)
    // 以后
    else buckets.later.push(task)
  }

  return GROUP_ORDER.map((key) => ({
    key,
    label: GROUP_LABELS[key],
    tasks: key === 'done' ? sortDone(buckets[key]) : sortTasks(buckets[key]),
  })).filter((group) => group.tasks.length > 0)
}

export type TaskFilter = 'today' | 'week' | 'all'

// 计算每周（周一 ~ 周日）第一天
export function startOfWeek(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.getDay() // 0 = 周日
  const offset = weekday === 0 ? 6 : weekday - 1
  date.setDate(date.getDate() - offset)
  return formatDate(date)
}

export function filterTasks(tasks: Task[], filter: TaskFilter, today: string): Task[] {
  if (filter === 'all') return tasks

  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)

  return tasks.filter((task) => {
    // 逾期任务永远可见
    if (!task.done && task.date < today) return true
    // 今天的任务
    if (filter === 'today') return task.date === today
    // 本周的任务
    return task.date >= weekStart && task.date <= weekEnd
  })
}
