import type { Database } from './db'
import type { Mastery } from '@/types'
import { addDays } from './date'

export type InsightRange = 7 | 30

export interface InsightKpis {
  completedTasks: number
  studyMinutes: number
  applications: number
  interviews: number
}

export interface StudyPoint {
  date: string
  minutes: number
}

export interface TopicMastery {
  topic: string
  total: number
  rusty: number
  learning: number
  solid: number
  score: number
}

export interface InsightSummary {
  kpis: InsightKpis
  studySeries: StudyPoint[]
  topics: TopicMastery[]
  hasActivity: boolean
}

export function rangeDates(today: string, days: InsightRange): string[] {
  return Array.from({ length: days }, (_, index) => addDays(today, index - (days - 1)))
}

const MASTERY_SCORE: Record<Mastery, number> = {
  rusty: 0,
  learning: 1,
  solid: 2,
}

export function summarize(db: Database, days: InsightRange, today: string): InsightSummary {
  const dates = rangeDates(today, days)
  const start = dates[0]

  const inRange = (date?: string): boolean => Boolean(date && date >= start && date <= today)

  // 完成任务数
  const completedTasks = db.tasks.filter(
    (task) => task.done && inRange(task.completedAt?.slice(0, 10)),
  ).length

  const studyLogs = db.studyLogs.filter((log) => inRange(log.date))
  const studyMinutes = studyLogs.reduce((sum, log) => sum + log.minutes, 0)

  const minutesByDate = new Map<string, number>()
  for (const log of studyLogs) {
    minutesByDate.set(log.date, (minutesByDate.get(log.date) ?? 0) + log.minutes)
  }

  const studySeries: StudyPoint[] = dates.map((date) => ({
    date,
    minutes: minutesByDate.get(date) ?? 0,
  }))

  const applications = db.applications.filter((app) => inRange(app.appliedAt)).length

  const interviews = db.applications.reduce((count, app) => {
    return (
      count +
      app.timeline.filter((event) => event.type === 'interview' && inRange(event.date)).length
    )
  }, 0)

  const topicMap = new Map<string, TopicMastery>()
  for (const item of db.knowledge) {
    if (!item.mastery) continue

    const entry = topicMap.get(item.topic) ?? {
      topic: item.topic,
      total: 0,
      rusty: 0,
      learning: 0,
      solid: 0,
      score: 0,
    }

    entry[item.mastery] += 1
    entry.total += 1
    topicMap.set(item.topic, entry)
  }

  const topics = [...topicMap.values()]
    .map((entry) => ({
      ...entry,
      score:
        (entry.solid * MASTERY_SCORE.solid + entry.learning * MASTERY_SCORE.learning) / entry.total,
    }))
    .sort((a, b) => a.score - b.score || b.total - a.total)

  return {
    kpis: { completedTasks, studyMinutes, applications, interviews },
    studySeries,
    topics,
    hasActivity: completedTasks + studyMinutes + applications + interviews > 0,
  }
}
