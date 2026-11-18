import type { Application, Priority, JobStage } from '@/types'
import { createId } from '@/lib/id'
import { localDate } from '@/lib/date'
import { useDatabase } from './db'
import { normalizeHttpUrl } from '@/lib/url'
import { stageLabel } from '@/lib/jobs'

export interface ApplicationInput {
  company: string
  role: string
  city?: string
  salary?: string
  channel?: string
  channelUrl?: string
  priority: Priority
  nextAction?: { label: string; date: string }
  note?: string
  resumeId?: string
  jobRequirements?: string
}

export function createApplication(input: ApplicationInput): Application | null {
  const company = input.company.trim()
  const role = input.role.trim()
  if (!company || !role) return null

  const now = new Date().toISOString()

  const db = useDatabase()
  const resumeId =
    input.resumeId && db.resumes.some((resume) => resume.id === input.resumeId)
      ? input.resumeId
      : undefined

  const app: Application = {
    id: createId(),
    company,
    role,
    city: input.city?.trim() || undefined,
    salary: input.salary?.trim() || undefined,
    channel: input.channel?.trim() || undefined,
    channelUrl: input.channelUrl ? (normalizeHttpUrl(input.channelUrl) ?? undefined) : undefined,
    stage: 'saved',
    priority: input.priority,
    nextAction: input.nextAction,
    note: input.note?.trim() || undefined,
    timeline: [
      {
        id: createId(),
        type: 'stage',
        text: '加入收藏',
        date: localDate(),
      },
    ],
    resumeId,
    jobRequirements: input.jobRequirements?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  }

  db.applications.push(app)
  return app
}

// 移动求职信息卡
export function moveApplication(id: string, stage: JobStage): Application | null {
  const db = useDatabase()
  const app = db.applications.find((item) => item.id === id)
  if (!app) return null
  if (app.stage === stage) return null

  const from = stageLabel(app.stage)
  const stale = app.nextAction

  app.stage = stage
  app.nextAction = undefined
  app.updatedAt = new Date().toISOString()

  app.timeline.push({
    id: createId(),
    type: 'stage',
    text: stale
      ? `阶段变更：${from} → ${stageLabel(stage)}（原待办「${stale.label}」已清除）`
      : `阶段变更：${from} → ${stageLabel(stage)}`,
    date: localDate(),
  })

  return app
}

export function setNextAction(
  id: string,
  nextAction: Application['nextAction'],
): Application | null {
  const db = useDatabase()
  const app = db.applications.find((item) => item.id === id)
  if (!app) return null

  app.nextAction = nextAction
  app.updatedAt = new Date().toISOString()
  return app
}

export function completeNextAction(id: string): Application | null {
  const db = useDatabase()
  const app = db.applications.find((item) => item.id === id)
  if (!app || !app.nextAction) return null

  const label = app.nextAction.label

  app.nextAction = undefined
  app.updatedAt = new Date().toISOString()
  app.timeline.push({
    id: createId(),
    type: 'followup',
    text: `完成下一步：${label}`,
    date: localDate(),
  })

  return app
}

// 更新求职信息
export function updateApplication(
  id: string,
  patch: Partial<Pick<Application, 'resumeId' | 'jobRequirements'>>,
): Application | null {
  const db = useDatabase()
  const app = db.applications.find((item) => item.id === id)
  if (!app) return null

  if ('resumeId' in patch) {
    if (patch.resumeId && !db.resumes.some((resume) => resume.id === patch.resumeId)) {
      return null
    }
    app.resumeId = patch.resumeId
  }

  if ('jobRequirements' in patch) {
    app.jobRequirements = patch.jobRequirements?.trim() || undefined
  }

  app.updatedAt = new Date().toISOString()
  return app
}
