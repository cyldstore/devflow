import type { TaskCategory } from '@/types'

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  learning: '学习',
  job: '求职',
  project: '项目',
  life: '生活',
}

export const CATEGORY_TONES = {
  learning: 'sage',
  job: 'blue',
  project: 'wood',
  life: 'stone',
} as const
