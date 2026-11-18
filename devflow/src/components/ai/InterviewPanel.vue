<template>
  <section class="interview-panel">
    <template v-if="!session">
      <div class="intro">
        <h2>模拟面试</h2>
        <p>根据简历和岗位要求，按基础 → 深挖 → 场景进行。</p>
        <p v-if="!resume" class="error">先为这个投递选择一份简历。</p>
        <p v-else-if="!app?.jobRequirements" class="hint">岗位要求为空，题目可能不够针对性。</p>
        <Button variant="lime" :disabled="!resume" @click="startInterview"> 开始面试 </Button>
      </div>
    </template>

    <template v-else>
      <header class="interview-head">
        <div>
          <p class="eyebrow">MOCK INTERVIEW</p>
          <h2>{{ session.company }} · {{ session.role }}</h2>
        </div>
        <div class="stage-badge">
          {{ STAGE_LABELS[session.stage] }} · 第 {{ questionNumber }} /
          {{ TOTAL_INTERVIEW_QUESTIONS }} 题
        </div>
      </header>

      <div class="messages">
        <div
          v-for="message in session.messages"
          :key="message.id"
          :class="['bubble', message.speaker]"
        >
          <p>{{ message.content }}</p>
        </div>

        <div v-if="streamingText" class="bubble interviewer">
          <p>{{ streamingText }}</p>
        </div>
      </div>

      <p v-if="errorNote" class="error" role="alert">{{ errorNote }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <form v-if="canAnswer" class="composer" @submit.prevent="submitAnswer">
        <textarea
          v-model="answerDraft"
          class="input textarea"
          rows="3"
          placeholder="输入你的回答，尽量具体"
        />
        <Button type="submit" size="sm" :disabled="!answerDraft.trim()">发送回答</Button>
      </form>

      <p v-else-if="isStreaming" class="hint">面试官正在提问…</p>

      <section v-if="isFinished && session.summary" class="summary">
        <h3>面试总结</h3>
        <p>{{ session.summary }}</p>
        <Button variant="ghost" size="sm" @click="restartInterview">重新开始</Button>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import { useDatabase } from '@/stores/db'
import { useInterview } from '@/composables/useInterview'
import { TOTAL_INTERVIEW_QUESTIONS } from '@/lib/ai/interview-prompts'

const props = defineProps<{ applicationId: string }>()

const db = useDatabase()
const app = computed(() => db.applications.find((item) => item.id === props.applicationId) ?? null)
const resume = computed(() =>
  app.value?.resumeId ? (db.resumes.find((item) => item.id === app.value?.resumeId) ?? null) : null,
)

const {
  session,
  isStreaming,
  error,
  errorNote,
  streamingText,
  questionNumber,
  canAnswer,
  isFinished,
  startInterview,
  answer,
  restart,
} = useInterview(props.applicationId)

const answerDraft = ref('')

const STAGE_LABELS = {
  basic: '基础',
  deep: '深挖',
  scenario: '场景',
} as const

async function submitAnswer(): Promise<void> {
  const value = answerDraft.value.trim()
  if (!value) return
  answerDraft.value = ''
  await answer(value)
}

async function restartInterview(): Promise<void> {
  if (!window.confirm('重新开始会清空当前面试记录，确定？')) return
  restart()
  await startInterview()
}
</script>

<style scoped>
.interview-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
}

.interview-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.interview-head h2 {
  margin: var(--space-1) 0 0;
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  color: var(--color-text-faint);
}

.stage-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-background);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 4px;
}

.bubble {
  max-width: 85%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
}

.bubble.interviewer {
  align-self: flex-start;
  background: var(--color-background);
  color: var(--color-text);
}

.bubble.candidate {
  align-self: flex-end;
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-background);
}

.summary h3 {
  margin: 0 0 var(--space-2);
}

.summary p {
  margin: 0 0 var(--space-3);
  white-space: pre-wrap;
  line-height: var(--leading-relaxed);
}

.intro {
  display: grid;
  gap: var(--space-3);
  max-width: 520px;
}

.intro h2 {
  margin: 0;
}

.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.error {
  margin: 0;
  color: var(--coral);
  font-size: var(--text-sm);
}
</style>
