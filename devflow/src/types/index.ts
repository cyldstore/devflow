export type TaskCategory = 'learning' | 'job' | 'project' | 'life'
export type Priority = 'P0' | 'P1' | 'P2'
export type KnowledgeType = 'note' | 'question' | 'snippet'
export type Mastery = 'rusty' | 'learning' | 'solid' // 生疏 / 学习中 / 熟练
// 收藏 / 已投递 / 面试中 / Offer / 已结束
export type JobStage = 'saved' | 'applied' | 'interview' | 'offer' | 'closed'

export interface Task {
  id: string
  title: string
  note?: string
  date: string // YYYY-MM-DD
  category: TaskCategory
  priority: Priority
  estimateMin?: number
  done: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeItem {
  id: string
  type: KnowledgeType
  title: string
  content: string // Markdown
  topic: string
  tags: string[]
  mastery?: Mastery
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  company: string
  role: string
  city?: string
  salary?: string
  channel?: string
  channelUrl?: string
  stage: JobStage
  priority: Priority
  appliedAt?: string
  nextAction?: { label: string; date: string }
  note?: string
  timeline: TimelineEvent[]
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  type: 'stage' | 'interview' | 'followup' | 'note'
  text: string
  date: string
}

export interface StudyLog {
  id: string
  date: string
  minutes: number
  topic: string
  activity: 'reading' | 'coding' | 'practice' | 'project'
  takeaway?: string
  knowledgeId?: string
}

export interface Profile {
  name: string
  targetRole: string
  weeklyGoalHours: number
  theme: 'light' | 'dark' | 'system'
  onboardingDone: boolean
}
