import { computed, onMounted, ref, onScopeDispose } from 'vue'
import { useDatabase } from '@/stores/db'
import { useAiSessionStore } from '@/stores/ai/session'
import { useSSE } from '@/composables/useSSE'
import {
  buildInterviewMessages,
  buildInterviewSummaryMessages,
  stageForQuestion,
  TOTAL_INTERVIEW_QUESTIONS,
} from '@/lib/ai/interview-prompts'

let disposed = false
onScopeDispose(() => {
  disposed = true
})

export function useInterview(applicationId: string) {
  const db = useDatabase()
  const store = useAiSessionStore()

  const session = computed(() => store.sessions[applicationId] ?? null)
  const errorNote = ref<string | null>(null)

  const { text, isStreaming, error, start, stop } = useSSE({
    url: '/api/ai/chat',
    body: { messages: [] },
    maxRetries: 1,
  })

  const streamingText = computed(() => (isStreaming.value ? text.value : ''))

  const interviewerCount = computed(
    () => session.value?.messages.filter((m) => m.speaker === 'interviewer').length ?? 0,
  )

  const questionNumber = computed(() =>
    Math.min(interviewerCount.value + 1, TOTAL_INTERVIEW_QUESTIONS),
  )

  const canAnswer = computed(
    () =>
      session.value?.status === 'active' &&
      !isStreaming.value &&
      session.value.messages.at(-1)?.speaker === 'interviewer',
  )

  const isFinished = computed(() => session.value?.status === 'finished')

  async function startInterview(): Promise<void> {
    if (session.value) {
      store.activate(applicationId)
      return
    }

    const app = db.applications.find((item) => item.id === applicationId)
    if (!app) {
      errorNote.value = '投递不存在'
      return
    }

    const resume = app.resumeId ? db.resumes.find((item) => item.id === app.resumeId) : null

    if (!resume?.content.trim()) {
      errorNote.value = '请先为这个投递选择一份简历'
      return
    }

    errorNote.value = null
    store.startSession(app, resume.content)
    await askNext()
  }

  async function askNext(): Promise<void> {
    const current = session.value
    if (!current) return

    if (interviewerCount.value >= TOTAL_INTERVIEW_QUESTIONS) {
      await askSummary()
      return
    }

    const messages = buildInterviewMessages(current)
    await start({ messages, purpose: 'interview' })

    if (disposed) return
    if (error.value || !text.value.trim()) return

    const content = text.value.trim()
    const stage = stageForQuestion(interviewerCount.value + 1)

    store.setStage(applicationId, stage)
    store.appendMessage(applicationId, {
      speaker: 'interviewer',
      content,
      stage,
    })
  }

  async function answer(content: string): Promise<void> {
    const current = session.value
    if (!current || !content.trim() || !canAnswer.value) return

    store.appendMessage(applicationId, {
      speaker: 'candidate',
      content: content.trim(),
      stage: current.stage,
    })

    if (interviewerCount.value >= TOTAL_INTERVIEW_QUESTIONS) {
      await askSummary()
    } else {
      await askNext()
    }
  }

  async function askSummary(): Promise<void> {
    const current = session.value
    if (!current) return

    const messages = buildInterviewSummaryMessages(current)
    await start({ messages, purpose: 'summary' })

    if (disposed) return
    if (error.value || !text.value.trim()) return

    store.finishSession(applicationId, text.value.trim())
  }

  function restart(): void {
    store.resetSession(applicationId)
    errorNote.value = null
  }

  function ensureFlow(): void {
    const current = session.value
    if (!current || current.status !== 'active' || isStreaming.value) return

    const last = current.messages.at(-1)
    if (!last || last.speaker === 'candidate') {
      void askNext()
    }
  }

  onMounted(ensureFlow)

  return {
    session,
    isStreaming,
    error,
    errorNote,
    streamingText,
    interviewerCount,
    questionNumber,
    canAnswer,
    isFinished,
    startInterview,
    answer,
    stop,
    restart,
  }
}
