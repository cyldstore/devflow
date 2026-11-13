import type { StudyLog } from '@/types'
import { createId } from '@/lib/id'
import { useDatabase } from './db'

export interface StudyLogInput {
  date: string
  minutes: number
  topic: string
  activity: StudyLog['activity']
  takeaway?: string
}

export function createStudyLog(input: StudyLogInput): StudyLog | null {
  const topic = input.topic.trim()
  if (!topic) return null
  if (!Number.isFinite(input.minutes) || input.minutes <= 0) return null

  const log: StudyLog = {
    id: createId(),
    date: input.date,
    minutes: Math.round(input.minutes),
    topic,
    activity: input.activity,
    takeaway: input.takeaway?.trim() || undefined,
  }

  useDatabase().studyLogs.push(log)
  return log
}
