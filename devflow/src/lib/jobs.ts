import type { Application, JobStage } from '@/types'

export interface StageColumn {
  stage: JobStage
  label: string
  applications: Application[]
}

export const JOB_STAGES: { value: JobStage; label: string }[] = [
  { value: 'saved', label: '收藏' },
  { value: 'applied', label: '已投递' },
  { value: 'interview', label: '面试中' },
  { value: 'offer', label: 'Offer' },
  { value: 'closed', label: '已结束' },
]

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 } as const

export function isFollowUpOverdue(app: Application, today: string): boolean {
  // 逾期判断排除了 Offer 和已结束
  if (!app.nextAction) return false
  if (app.stage === 'offer' || app.stage === 'closed') return false
  return app.nextAction.date < today
}

export function sortApplications(apps: Application[]): Application[] {
  return [...apps].sort((a, b) => {
    // 按优先级排序
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (byPriority !== 0) return byPriority

    // 优先级相同
    // 没有下一步的排在有下一步的后面
    const aDate = a.nextAction?.date ?? '9999-12-31'
    const bDate = b.nextAction?.date ?? '9999-12-31'
    if (aDate !== bDate) return aDate < bDate ? -1 : 1

    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

// 分组
export function groupApplications(apps: Application[]): StageColumn[] {
  const buckets: Record<JobStage, Application[]> = {
    saved: [],
    applied: [],
    interview: [],
    offer: [],
    closed: [],
  }

  for (const app of apps) {
    buckets[app.stage].push(app)
  }

  return JOB_STAGES.map(({ value, label }) => ({
    stage: value,
    label,
    applications: sortApplications(buckets[value]),
  }))
}
