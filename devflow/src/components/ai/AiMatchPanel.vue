<template>
  <section class="block ai-panel" :aria-busy="isStreaming">
    <div class="ai-head">
      <h3 class="block-title">AI 匹配分析</h3>
      <span v-if="firstTokenMs !== null" class="latency">首字 {{ firstTokenMs }}ms</span>
    </div>

    <p v-if="!resume" class="hint">先在简历模块准备一份简历，再生成匹配分析。</p>
    <p v-else-if="!canAnalyze" class="hint">简历内容为空，先在简历模块补充正文。</p>

    <template v-else>
      <div class="actions">
        <Button size="sm" :disabled="!canAnalyze || isStreaming" @click="analyze">
          {{ isStreaming ? '分析中…' : text ? '重新分析' : '生成匹配分析' }}
        </Button>
        <Button v-if="isStreaming" variant="ghost" size="sm" @click="stop">停止</Button>
      </div>

      <p v-if="indexState === 'checking' || indexState === 'indexing'" class="hint">
        正在准备 AI 索引…
      </p>
      <p v-else-if="indexState === 'error'" class="hint">
        索引失败：{{ indexError }}
        <button type="button" class="retry-link" @click="ensureIndex">重试</button>
      </p>

      <p class="privacy">索引会把简历发送到本地服务端；分析会把简历和岗位信息发送给模型服务。</p>
      <p v-if="promptTokens > 0" class="hint">Prompt ≈ {{ promptTokens }} tokens</p>

      <p v-if="isRetrying" class="hint" role="status">网络不稳定，正在重试…</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <!-- <p v-if="text" class="output" aria-live="polite">{{ text }}</p> -->
      <p v-if="text" class="output" aria-live="polite" v-html="textHtml"></p>
      <p v-else-if="isStreaming" class="hint">正在等待首个 token…</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Application, Resume } from '@/types'
import { useSSE } from '@/composables/useSSE'
import Button from '@/components/ui/Button.vue'
import { buildMatchAnalysisMessages } from '@/lib/ai/prompts'
import { estimateMessagesTokens } from '@/lib/ai/tokens'
import { useRagIndex } from '@/composables/useRagIndex'
import { renderMarkdown } from '@/lib/markdown'

const props = defineProps<{
  application: Application
  resume?: Resume | null
}>()

const canAnalyze = computed(() => Boolean(props.resume?.content.trim()))

const { text, isStreaming, error, firstTokenMs, start, stop, isRetrying } = useSSE({
  url: '/api/ai/chat',
  body: { messages: [] },
  maxRetries: 1,
})

const messages = computed(() => {
  if (!props.resume || !canAnalyze.value) return []
  return buildMatchAnalysisMessages({
    application: props.application,
    resume: props.resume,
  })
})

const promptTokens = computed(() => estimateMessagesTokens(messages.value))

const {
  state: indexState,
  error: indexError,
  ensureIndex,
} = useRagIndex(() => {
  if (!props.resume) return null
  return {
    docType: 'resume',
    docId: props.resume.id,
    title: props.resume.title,
    content: props.resume.content,
    version: props.resume.updatedAt,
  }
})

function analyze(): void {
  if (!canAnalyze.value || isStreaming.value || !props.resume) return

  void start({ messages: messages.value, purpose: 'analysis' })
}

const textHtml = computed(() => {
  return renderMarkdown(text.value)
})
</script>

<style scoped>
.ai-panel {
  display: grid;
  gap: 10px;
}

.ai-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.latency {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hint,
.privacy {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-2xs);
}

.error {
  margin: 0;
  color: var(--coral);
  font-size: 13px;
}

.output {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

.block-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}
</style>
