import type { Resume, ResumeFileType } from '@/types'
import { createId } from '@/lib/id'
import { useDatabase } from './db'

export interface ResumeInput {
  title: string
  content: string
  fileName?: string
  fileType?: ResumeFileType
}

export function addResume(input: ResumeInput): Resume {
  const db = useDatabase()
  const now = new Date().toISOString()

  const resume: Resume = {
    id: createId(),
    title: input.title.trim() || '未命名简历',
    content: input.content,
    updatedAt: now,
    fileName: input.fileName,
    fileType: input.fileType,
  }

  db.resumes.push(resume)
  return resume
}

export function removeResume(id: string): number {
  const db = useDatabase()
  const affected = db.applications.filter((app) => app.resumeId === id)

  for (const app of affected) {
    app.resumeId = undefined
    app.updatedAt = new Date().toISOString()
  }

  const index = db.resumes.findIndex((resume) => resume.id === id)
  if (index >= 0) {
    db.resumes.splice(index, 1)
  }

  return affected.length
}

export function getApplicationResume(applicationId: string): Resume | null {
  const db = useDatabase()
  const app = db.applications.find((item) => item.id === applicationId)
  if (!app?.resumeId) return null
  return db.resumes.find((resume) => resume.id === app.resumeId) ?? null
}

export function setApplicationResume(applicationId: string, resumeId: string | undefined): void {
  const db = useDatabase()
  const app = db.applications.find((item) => item.id === applicationId)
  if (!app) return

  if (resumeId && !db.resumes.some((resume) => resume.id === resumeId)) {
    return
  }

  app.resumeId = resumeId
  app.updatedAt = new Date().toISOString()
}
