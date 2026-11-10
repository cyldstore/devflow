import type { Application, KnowledgeItem, Profile, StudyLog, Task } from '@/types'
import { readJSON, writeJSON } from './storage'

const DB_KEY = 'db'
const DB_VERSION = 1

// 数据结构
export interface Database {
  version: number
  tasks: Task[]
  knowledge: KnowledgeItem[]
  applications: Application[]
  studyLogs: StudyLog[]
  profile: Profile
}

// 创建空数据
export function createEmptyDatabase(): Database {
  return {
    version: DB_VERSION,
    tasks: [],
    knowledge: [],
    applications: [],
    studyLogs: [],
    profile: {
      name: '',
      targetRole: '',
      weeklyGoalHours: 5,
      theme: 'system',
      onboardingDone: false,
    },
  }
}

// 加载数据
export function loadDatabase(): Database {
  return normalizeDatabase(readJSON<unknown>(DB_KEY, null))
}

// 保存数据
export function saveDatabase(db: Database): boolean {
  return writeJSON(DB_KEY, { ...db, version: DB_VERSION })
}

// 格式化数据
export function normalizeDatabase(raw: unknown): Database {
  const base = createEmptyDatabase()
  if (typeof raw !== 'object' || raw === null) return base

  const data = raw as Partial<Database>

  return {
    version: DB_VERSION,
    tasks: Array.isArray(data.tasks) ? data.tasks : base.tasks,
    knowledge: Array.isArray(data.knowledge) ? data.knowledge : base.knowledge,
    applications: Array.isArray(data.applications) ? data.applications : base.applications,
    studyLogs: Array.isArray(data.studyLogs) ? data.studyLogs : base.studyLogs,
    profile: isProfile(data.profile) ? data.profile : base.profile,
  }
}

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Partial<Profile>
  return (
    typeof p.name === 'string' &&
    typeof p.targetRole === 'string' &&
    typeof p.weeklyGoalHours === 'number' &&
    typeof p.onboardingDone === 'boolean'
  )
}
