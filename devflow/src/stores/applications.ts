import type { Application, Priority } from '@/types'
import { createId } from '@/lib/id'
import { localDate } from '@/lib/date'
import { useDatabase } from './db'
import { normalizeHttpUrl } from '@/lib/url'

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
}

export function createApplication(input: ApplicationInput): Application | null {
  const company = input.company.trim()
  const role = input.role.trim()
  if (!company || !role) return null

  const now = new Date().toISOString()

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
    createdAt: now,
    updatedAt: now,
  }

  useDatabase().applications.push(app)
  return app
}
