<template>
  <section class="qa-panel">
    <div class="qa-head">
      <h3>AI 问答</h3>
      <span v-if="firstTokenMs !== null" class="latency">首字 {{ firstTokenMs }}ms</span>
    </div>

    <p v-if="indexState === 'checking' || indexState === 'indexing'" class="hint">
      正在准备 AI 索引…
    </p>
    <p v-else-if="indexState === 'empty'" class="hint">内容为空，无法建立索引。</p>
    <p v-else-if="indexState === 'error'" class="error">
      索引准备失败：{{ indexError }}
      <button type="button" class="retry" @click="ensureIndex">重试</button>
    </p>

    <form class="qa-form" @submit.prevent="ask">
      <input
        v-model="question"
        class="input"
        type="text"
        placeholder="基于这条内容提问"
        :disabled="indexState !== 'ready' || searching || isStreaming"
      />
      <Button
        type="submit"
        size="sm"
        :disabled="indexState !== 'ready' || !question.trim() || searching || isStreaming"
      >
        {{ searching ? '检索中…' : isStreaming ? '生成中…' : '提问' }}
      </Button>
      <Button v-if="isStreaming" variant="ghost" size="sm" @click="stop">停止</Button>
    </form>

    <p class="privacy">提问会把问题和检索到的内容发送给模型服务。</p>

    <div class="qa-body">
      <p v-if="answerStale" class="hint" role="status">笔记已更新；下面的回答基于更新前的内容。</p>
      <p v-if="searchError" class="error" role="alert">{{ searchError }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <!-- <p v-if="text" class="answer" aria-live="polite">{{ text }}</p> -->
      <p v-if="text" class="answer" aria-live="polite" v-html="textHtml"></p>
      <p v-else-if="isStreaming" class="hint">正在等待首个 token…</p>

      <ol v-if="citations.length > 0" class="citations">
        <li
          v-for="(citation, index) in citations"
          :key="`${citation.docId}-${citation.chunkIndex}`"
        >
          <span class="citation-no">[{{ index + 1 }}]</span>
          <span>{{ citation.title }} · chunk {{ citation.chunkIndex }}</span>
          <span class="citation-score">score {{ citation.score.toFixed(2) }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import type { KnowledgeItem } from '@/types'
import Button from '@/components/ui/Button.vue'
import { useSSE } from '@/composables/useSSE'
import { buildKnowledgeQaMessages } from '@/lib/ai/prompts'
import { getIndexStatus, indexDocument, searchDocuments, type RagSearchResult } from '@/lib/ai/rag'
import { renderMarkdown } from '@/lib/markdown'

const props = defineProps<{
  item: KnowledgeItem
}>()

const question = ref('')
const searching = ref(false)
const searchError = ref<string | null>(null)
const citations = ref<RagSearchResult[]>([])

const { text, isStreaming, error, firstTokenMs, start, stop } = useSSE({
  url: '/api/ai/chat',
  body: { messages: [] },
  maxRetries: 1,
})

async function ask(): Promise<void> {
  const value = question.value.trim()
  if (indexState.value !== 'ready' || !value || searching.value || isStreaming.value) {
    return
  }

  searching.value = true
  searchError.value = null
  citations.value = []
  answerStale.value = false

  try {
    const result = await searchDocuments({
      query: value,
      docType: 'knowledge',
      docId: props.item.id,
      topK: 5,
    })

    if (result.results.length === 0) {
      searchError.value = '没有检索到相关内容，请先索引这条知识。'
      return
    }

    citations.value = result.results

    void start({ messages: buildKnowledgeQaMessages(value, result.results), purpose: 'qa' })
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : '检索失败'
  } finally {
    searching.value = false
  }
}

type IndexState = 'checking' | 'indexing' | 'ready' | 'error' | 'empty'

const indexState = ref<IndexState>('checking')
const indexError = ref<string | null>(null)

let indexRun = 0

async function ensureIndex(): Promise<void> {
  const run = ++indexRun

  if (!props.item.content.trim()) {
    indexState.value = 'empty'
    return
  }

  indexState.value = 'checking'
  indexError.value = null

  try {
    const status = await getIndexStatus({
      docType: 'knowledge',
      docId: props.item.id,
    })

    if (run !== indexRun) return

    if (status.indexed && status.sourceUpdatedAt === props.item.updatedAt) {
      indexState.value = 'ready'
      return
    }

    indexState.value = 'indexing'

    await indexDocument({
      docType: 'knowledge',
      docId: props.item.id,
      title: props.item.title,
      content: props.item.content,
      sourceUpdatedAt: props.item.updatedAt,
    })

    if (run !== indexRun) return
    indexState.value = 'ready'
  } catch (err) {
    if (run !== indexRun) return
    indexError.value = err instanceof Error ? err.message : '索引准备失败'
    indexState.value = 'error'
  }
}

const answerStale = ref(false)

const INDEX_DEBOUNCE_MS = 1200
let indexTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.item.updatedAt,
  () => {
    answerStale.value = Boolean(text.value)
    clearTimeout(indexTimer)
    indexTimer = setTimeout(() => void ensureIndex(), INDEX_DEBOUNCE_MS)
  },
)

onBeforeUnmount(() => {
  clearTimeout(indexTimer)
})

const textHtml = computed(() => {
  return renderMarkdown(text.value)
})

onMounted(ensureIndex)
</script>

<style scoped>
.qa-panel {
  display: grid;
  gap: 10px;
  margin: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.qa-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.qa-head h3 {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.latency {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
}

.qa-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.qa-form .input {
  flex: 1;
  min-width: 200px;
}

.privacy,
.hint {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-2xs);
}

.error {
  margin: 0;
  color: var(--coral);
  font-size: 13px;
}

.answer {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

.citations {
  margin: 0;
  padding-left: 20px;
  color: var(--muted);
  font-size: var(--text-2xs);
  display: grid;
  gap: 4px;
}

.citation-no {
  color: var(--color-text);
  font-family: var(--font-mono);
}

.citation-score {
  margin-left: 6px;
  font-family: var(--font-mono);
}

.qa-body {
  display: grid;
  gap: 10px;
}

@media (max-width: 1023px) {
  .detail {
    position: static;
    height: auto;
    min-height: 0;
    max-height: none;
  }

  .detail-scroll {
    overflow: visible;
  }

  .detail-qa {
    min-height: 0;
    max-height: none;
    display: block;
  }
}
</style>
