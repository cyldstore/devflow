import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Application, InterviewMessage, InterviewSession, InterviewStage } from '@/types'
import { createId } from '@/lib/id'

export const useAiSessionStore = defineStore('aiSession', () => {
  const sessions = ref<Record<string, InterviewSession>>({})
  const activeApplicationId = ref<string | null>(null)

  const activeSession = computed(() =>
    activeApplicationId.value ? (sessions.value[activeApplicationId.value] ?? null) : null,
  )

  function startSession(application: Application, resumeContent: string): InterviewSession {
    const now = new Date().toISOString()

    const session: InterviewSession = {
      id: createId(),
      applicationId: application.id,
      resumeId: application.resumeId,
      resumeSnapshot: resumeContent,
      jobRequirementsSnapshot: application.jobRequirements ?? '',
      company: application.company,
      role: application.role,
      stage: 'basic',
      status: 'active',
      messages: [],
      createdAt: now,
      updatedAt: now,
    }

    sessions.value[application.id] = session
    activeApplicationId.value = application.id
    return session
  }

  function appendMessage(
    applicationId: string,
    message: Omit<InterviewMessage, 'id' | 'createdAt'>,
  ): InterviewMessage | null {
    const session = sessions.value[applicationId]
    if (!session) return null

    const full: InterviewMessage = {
      ...message,
      id: createId(),
      createdAt: new Date().toISOString(),
    }

    session.messages.push(full)
    session.updatedAt = full.createdAt
    return full
  }

  function setStage(applicationId: string, stage: InterviewStage): void {
    const session = sessions.value[applicationId]
    if (!session) return

    session.stage = stage
    session.updatedAt = new Date().toISOString()
  }

  function finishSession(applicationId: string, summary?: string): void {
    const session = sessions.value[applicationId]
    if (!session) return

    session.status = 'finished'
    session.summary = summary
    session.updatedAt = new Date().toISOString()
  }

  function activate(applicationId: string): void {
    if (sessions.value[applicationId]) {
      activeApplicationId.value = applicationId
    }
  }

  function resetSession(applicationId: string): void {
    delete sessions.value[applicationId]
    if (activeApplicationId.value === applicationId) {
      activeApplicationId.value = null
    }
  }

  return {
    sessions,
    activeApplicationId,
    activeSession,
    startSession,
    appendMessage,
    setStage,
    finishSession,
    activate,
    resetSession,
  }
})
