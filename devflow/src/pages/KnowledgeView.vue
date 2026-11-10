<template>
  <section class="knowledge">
    <Card class="panel">
      <header class="panel-head">
        <h1>知识库</h1>
        <div class="panel-actions">
          <span class="count">{{ items.length }}</span>
          <Button variant="ghost" @click="createOpen = true">
            <Plus :size="14" aria-hidden="true" />
            新建
          </Button>
        </div>
      </header>

      <!-- 类型筛选 -->
      <div class="tabs" role="group" aria-label="按类型筛选">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          type="button"
          :class="['tab', { active: filter === tab.value }]"
          :aria-pressed="filter === tab.value"
          @click="filter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="db.knowledge.length === 0" class="empty">
        <p class="empty-title">知识库还是空的</p>
        <p class="empty-text">载入示例数据，或者等下一步加上新建。</p>
        <Button variant="lime" @click="loadSeed">载入示例数据</Button>
      </div>

      <div v-else-if="items.length === 0" class="empty">
        <p class="empty-title">这个类型下还没有内容</p>
        <p class="empty-text">换一个类型，或者切回"全部"。</p>
        <Button variant="ghost" @click="filter = 'all'">清除筛选</Button>
      </div>

      <!-- 标题区 -->
      <ul v-else class="list">
        <li v-for="item in items" :key="item.id" class="item-row">
          <button
            type="button"
            :class="['item', { active: selectedId === item.id }]"
            :aria-current="selectedId === item.id ? 'true' : undefined"
            @click="selectedId = item.id"
          >
            <div class="item-top">
              <Pin v-if="item.pinned" :size="11" aria-hidden="true" />
              <span class="item-type">{{ TYPE_LABELS[item.type] }}</span>
              <Chip v-if="item.mastery" :tone="MASTERY_TONES[item.mastery]">
                {{ MASTERY_LABELS[item.mastery] }}
              </Chip>
            </div>

            <p class="item-title">{{ item.title }}</p>

            <div class="item-meta">
              <span class="topic">{{ item.topic }}</span>
              <span v-for="tag in item.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </button>
        </li>
      </ul>
    </Card>

    <!-- md内容区 -->
    <Card class="detail">
      <template v-if="selected">
        <header class="detail-head">
          <div class="item-top">
            <span class="item-type">{{ TYPE_LABELS[selected.type] }}</span>
            <Chip v-if="selected.mastery" :tone="MASTERY_TONES[selected.mastery]">
              {{ MASTERY_LABELS[selected.mastery] }}
            </Chip>
            <span v-if="selected.pinned" class="pin">
              <Pin :size="11" aria-hidden="true" />
              已置顶
            </span>
          </div>

          <h2 class="detail-title">{{ selected.title }}</h2>

          <div class="item-meta">
            <span class="topic">{{ selected.topic }}</span>
            <span v-for="tag in selected.tags" :key="tag" class="tag">#{{ tag }}</span>
            <time class="detail-time" :datetime="selected.updatedAt">
              更新于 {{ selected.updatedAt.slice(0, 10) }}
            </time>
          </div>
        </header>

        <div class="prose" v-html="selectedHtml" />
      </template>

      <div v-else class="detail-empty">
        <p class="detail-title">选择左侧条目查看</p>
        <p class="detail-text">点一条笔记、面试题或代码片段，内容会显示在这里。</p>
      </div>
    </Card>

    <!-- 类型选择器 -->
    <AppDialog
      v-model:open="createOpen"
      title="新建条目"
      description="先选一个类型，正文模板会按类型预填。"
    >
      <div class="type-grid">
        <button
          v-for="option in TYPE_OPTIONS"
          :key="option.value"
          type="button"
          class="type-card"
          @click="chooseType(option.value)"
        >
          <span class="type-card-label">{{ option.label }}</span>
          <span class="type-card-desc">{{ option.desc }}</span>
        </button>
      </div>
    </AppDialog>

    <!-- 编辑抽屉 -->
    <AppDrawer
      v-model:open="editorOpen"
      :title="`新建${TYPE_LABELS[draftType]}`"
      :description="TYPE_HINTS[draftType]"
    >
      <form id="knowledge-form" class="form" @submit.prevent="saveNew">
        <label class="field">
          <span class="field-label">{{ draftType === 'question' ? '题目' : '标题' }}</span>
          <input v-model="draft.title" class="input" type="text" required />
        </label>

        <div class="field-row">
          <label class="field">
            <span class="field-label">主题（必填）</span>
            <input
              v-model="draft.topic"
              class="input"
              type="text"
              placeholder="Vue / 浏览器 / JavaScript"
            />
          </label>

          <label class="field">
            <span class="field-label">掌握度</span>
            <select v-model="draft.mastery" class="input">
              <option value="">不标记</option>
              <option value="rusty">生疏</option>
              <option value="learning">学习中</option>
              <option value="solid">熟练</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span class="field-label">标签</span>
          <input
            v-model="draft.tagsText"
            class="input"
            type="text"
            placeholder="用逗号分隔，如：响应式, 基础"
          />
        </label>

        <label class="field">
          <span class="field-label">正文（Markdown）</span>
          <textarea v-model="draft.content" class="input textarea code" rows="14" />
        </label>
      </form>

      <template #footer>
        <Button variant="ghost" @click="editorOpen = false">取消</Button>
        <Button variant="lime" type="submit" form="knowledge-form" :disabled="!canCreate">
          创建
        </Button>
      </template>
    </AppDrawer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { Pin, Plus } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import { filterKnowledge, KNOWLEDGE_TYPE_LABELS, sortKnowledge } from '@/lib/knowledge'
import type { KnowledgeFilter } from '@/lib/knowledge'
import { loadSeed, useDatabase } from '@/stores/db'
import type { Mastery, KnowledgeType } from '@/types'
import { renderMarkdown } from '@/lib/markdown'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import { createKnowledge } from '@/stores/knowledge'
import { toast } from '@/lib/toast'

const TABS: { value: KnowledgeFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'note', label: '笔记' },
  { value: 'question', label: '面试题' },
  { value: 'snippet', label: '代码片段' },
]

const TYPE_LABELS = KNOWLEDGE_TYPE_LABELS

const MASTERY_LABELS: Record<Mastery, string> = {
  rusty: '生疏',
  learning: '学习中',
  solid: '熟练',
}

const MASTERY_TONES = {
  rusty: 'coral',
  learning: 'amber',
  solid: 'lime',
} as const

const db = useDatabase()
const filter = ref<KnowledgeFilter>('all')

const items = computed(() => sortKnowledge(filterKnowledge(db.knowledge, filter.value)))

const selectedId = ref<string | null>(null)

const selected = computed(() => db.knowledge.find((item) => item.id === selectedId.value) ?? null)

const selectedHtml = computed(() => (selected.value ? renderMarkdown(selected.value.content) : ''))

const TYPE_OPTIONS: { value: KnowledgeType; label: string; desc: string }[] = [
  { value: 'note', label: '笔记', desc: '一段理解、一个结论或一组要点' },
  { value: 'question', label: '面试题', desc: '题目、我的答案、参考答案与追问' },
  { value: 'snippet', label: '代码片段', desc: '一段可复用的代码和说明' },
]

const TYPE_HINTS: Record<KnowledgeType, string> = {
  note: '记录你真正理解了什么，别抄定义。',
  question: '用自己的话写答案，再补参考答案做对照。',
  snippet: '代码块已经预填好，把语言改成你用的那个。',
}

const CONTENT_TEMPLATES: Record<KnowledgeType, string> = {
  note: '## 要点\n\n',
  question: '## 我的答案\n\n## 参考答案\n\n## 追问\n\n',
  snippet: '```ts\n\n```\n\n## 说明\n\n',
}

const createOpen = ref(false)
const editorOpen = ref(false)
const draftType = ref<KnowledgeType>('note')

const draft = reactive({
  title: '',
  topic: '',
  tagsText: '',
  mastery: '' as Mastery | '',
  content: '',
})

const canCreate = computed(() => draft.title.trim().length > 0 && draft.topic.trim().length > 0)

function chooseType(type: KnowledgeType) {
  draftType.value = type
  draft.title = ''
  draft.topic = ''
  draft.tagsText = ''
  draft.mastery = ''
  draft.content = CONTENT_TEMPLATES[type]
  createOpen.value = false
  editorOpen.value = true
}

function parseTags(text: string): string[] {
  const tags = text
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
  return [...new Set(tags)]
}

function saveNew() {
  if (!canCreate.value) return

  const item = createKnowledge({
    type: draftType.value,
    title: draft.title,
    content: draft.content,
    topic: draft.topic,
    tags: parseTags(draft.tagsText),
    mastery: draft.mastery || undefined,
  })
  if (!item) return

  selectedId.value = item.id
  filter.value = 'all'
  editorOpen.value = false
  toast.add({ title: '已创建', description: item.title, status: 'success', duration: 3000 })
}
</script>

<style scoped>
.knowledge {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

h1 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-faint);
}

.tabs {
  display: flex;
  gap: var(--space-1);
  padding: 0 var(--space-5) var(--space-3);
  overflow-x: auto;
}

.tab {
  height: 26px;
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-xs);
  white-space: nowrap;
  cursor: pointer;
}

.tab:hover {
  color: var(--color-text-strong);
}

.tab.active {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text-strong);
  font-weight: 600;
}

.tab:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.list {
  margin: 0;
  padding: 0 var(--space-2) var(--space-3);
  list-style: none;
}

.item-row {
  list-style: none;
}

.item-row + .item-row {
  border-top: 1px solid var(--color-border);
}

.item {
  display: block;
  width: 100%;
  padding: var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item + .item {
  border-top: 1px solid var(--color-border);
  border-radius: 0;
}

.item:hover {
  background: var(--color-background);
}

.item-top {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-faint);
}

.item-type {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.item-title {
  margin: var(--space-2) 0 var(--space-1);
  font-size: var(--text-base);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-faint);
}

.item.active {
  background: var(--color-accent-soft);
}

.item:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: -2px;
}

.topic {
  font-weight: 600;
}

.empty {
  padding: var(--space-6);
}

.detail {
  min-height: 320px;
}

.detail-head {
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.detail-empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-8);
}

.detail-title {
  margin: var(--space-2) 0 var(--space-3);
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
}

.detail-text {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.detail-time {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.prose {
  padding: var(--space-6);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  margin: var(--space-6) 0 var(--space-3);
  color: var(--color-text-strong);
  letter-spacing: -0.02em;
}

.prose :deep(h1) {
  font-size: var(--text-xl);
}

.prose :deep(h2) {
  font-size: var(--text-lg);
}

.prose :deep(h3) {
  font-size: var(--text-base);
}

.prose :deep(p) {
  margin: 0 0 var(--space-4);
}

.prose :deep(ul),
.prose :deep(ol) {
  margin: 0 0 var(--space-4);
  padding-left: var(--space-6);
}

.prose :deep(li) {
  margin-bottom: var(--space-1);
}

.prose :deep(code) {
  padding: 2px 5px;
  border-radius: var(--radius-xs);
  background: var(--color-background);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.prose :deep(pre) {
  margin: 0 0 var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  overflow-x: auto;
}

.prose :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: var(--text-sm);
}

.prose :deep(blockquote) {
  margin: 0 0 var(--space-4);
  padding-left: var(--space-4);
  border-left: 2px solid var(--color-accent-strong);
  color: var(--color-text-muted);
}

.prose :deep(a) {
  color: var(--color-tone-lime-fg);
  text-decoration: underline;
}

.prose :deep(hr) {
  margin: var(--space-5) 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.prose :deep(table) {
  width: 100%;
  margin-bottom: var(--space-4);
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.prose :deep(th),
.prose :deep(td) {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  text-align: left;
}

@media (max-width: 1023px) {
  .knowledge {
    grid-template-columns: 1fr;
  }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.type-grid {
  display: grid;
  gap: var(--space-3);
}

.type-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.type-card:hover {
  border-color: var(--color-accent-strong);
  background: var(--color-surface);
}

.type-card:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.type-card-label {
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--color-text-strong);
}

.type-card-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.field-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.input {
  height: 36px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-base);
}

.input:focus-visible {
  outline: 2px solid var(--color-accent-strong);
  outline-offset: 1px;
}

.textarea {
  height: auto;
  padding: var(--space-3) var(--space-4);
  resize: vertical;
  line-height: var(--leading-normal);
}

.code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

@media (max-width: 767px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
