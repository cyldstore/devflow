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

      <!-- 搜索 -->
      <div class="filters">
        <div class="search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="keyword"
            type="search"
            class="search-input"
            placeholder="搜索标题、主题、标签"
            aria-label="搜索知识库"
          />
          <button
            v-if="keyword"
            type="button"
            class="search-clear"
            aria-label="清除搜索"
            @click="keyword = ''"
          >
            <X :size="13" aria-hidden="true" />
          </button>
        </div>

        <div v-if="topicFilter" class="active-topic">
          <span>主题：{{ topicFilter }}</span>
          <button
            type="button"
            class="active-topic-clear"
            aria-label="清除主题筛选"
            @click="clearTopic"
          >
            <X :size="12" aria-hidden="true" />
          </button>
        </div>

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

        <div class="mastery-row">
          <span class="filter-label">掌握度</span>
          <select v-model="masteryFilter" class="mastery-select" aria-label="按掌握度筛选">
            <option value="all">全部</option>
            <option value="rusty">生疏</option>
            <option value="learning">学习中</option>
            <option value="solid">熟练</option>
          </select>
        </div>

        <div v-if="allTags.length > 0" class="tag-filter" role="group" aria-label="按标签筛选">
          <button
            v-for="tag in allTags"
            :key="tag"
            type="button"
            class="tag-chip"
            :class="{ active: activeTags.includes(tag) }"
            :aria-pressed="activeTags.includes(tag)"
            @click="toggleTag(tag)"
          >
            #{{ tag }}
          </button>
        </div>
      </div>

      <div v-if="db.knowledge.length === 0" class="empty">
        <p class="empty-title">知识库还是空的</p>
        <p class="empty-text">载入示例数据，或者等下一步加上新建。</p>
        <Button variant="lime" @click="loadSeed">载入示例数据</Button>
      </div>

      <div v-else-if="items.length === 0" class="empty">
        <p class="empty-title">
          <template v-if="keyword">没有匹配「{{ keyword }}」的内容</template>
          <template v-else>当前筛选下没有内容</template>
        </p>
        <p class="empty-text">换个关键词，或者清除筛选看看全部。</p>
        <Button variant="ghost" @click="clearFilters">清除筛选</Button>
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
          <div class="detail-top">
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

            <div class="detail-actions">
              <Button
                variant="quiet"
                size="sm"
                class="pin-btn"
                :aria-pressed="selected.pinned"
                @click="togglePin(selected)"
              >
                <Pin :size="13" aria-hidden="true" />
                {{ selected.pinned ? '已置顶' : '置顶' }}
              </Button>

              <Button variant="ghost" size="sm" @click="startEdit(selected)">
                <Pencil :size="13" aria-hidden="true" />
                编辑
              </Button>

              <Button variant="ghost" size="sm" class="danger-text" @click="askDelete(selected)">
                <Trash2 :size="13" aria-hidden="true" />
                删除
              </Button>
            </div>
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

        <div class="detail-tabs" role="tablist" aria-label="知识详情视图">
          <button
            id="detail-tab-content"
            type="button"
            role="tab"
            :aria-selected="detailTab === 'content'"
            aria-controls="detail-panel-content"
            :class="['detail-tab', { active: detailTab === 'content' }]"
            @click="detailTab = 'content'"
          >
            内容
          </button>

          <button
            id="detail-tab-qa"
            type="button"
            role="tab"
            :aria-selected="detailTab === 'qa'"
            aria-controls="detail-panel-qa"
            :class="['detail-tab', { active: detailTab === 'qa' }]"
            @click="detailTab = 'qa'"
          >
            AI 问答
          </button>
        </div>

        <div
          v-show="detailTab === 'content'"
          id="detail-panel-content"
          role="tabpanel"
          aria-labelledby="detail-tab-content"
          class="prose"
          v-html="selectedHtml"
        />

        <KnowledgeQaPanel
          v-show="detailTab === 'qa'"
          id="detail-panel-qa"
          role="tabpanel"
          aria-labelledby="detail-tab-qa"
          :key="selected.id"
          :item="selected"
        />
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
    <AppDrawer v-model:open="editorOpen" :title="drawerTitle" :description="drawerHint">
      <form id="knowledge-form" class="form" @submit.prevent="save">
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
        <template v-if="isEditing">
          <span class="save-state" :data-state="saveState">{{ saveStateText }}</span>
          <Button variant="ghost" @click="editorOpen = false">完成</Button>
        </template>

        <template v-else>
          <Button variant="ghost" @click="editorOpen = false">取消</Button>
          <Button variant="lime" type="submit" form="knowledge-form" :disabled="!canSave">
            创建
          </Button>
        </template>
      </template>
    </AppDrawer>

    <!-- 删除弹窗 -->
    <AppDialog
      v-model:open="deleteOpen"
      title="删除这条内容？"
      :description="deleteTarget ? `「${deleteTarget.title}」删除后无法恢复。` : ''"
    >
      <p class="confirm-text">这条内容不会被放进回收站，也无法撤销。</p>

      <template #footer>
        <Button variant="ghost" @click="deleteOpen = false">取消</Button>
        <Button variant="danger" @click="confirmDelete">删除</Button>
      </template>
    </AppDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, reactive, nextTick, onBeforeUnmount, watch, onMounted } from 'vue'
import { Pin, Plus, Pencil, Trash2, Search, X } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import { filterKnowledge, KNOWLEDGE_TYPE_LABELS, sortKnowledge } from '@/lib/knowledge'
import type { KnowledgeFilter, MasteryFilter } from '@/lib/knowledge'
import { loadSeed, useDatabase } from '@/stores/db'
import type { Mastery, KnowledgeType, KnowledgeItem } from '@/types'
import { renderMarkdown } from '@/lib/markdown'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import {
  createKnowledge,
  updateKnowledge,
  removeKnowledge,
  toggleKnowledgePin,
} from '@/stores/knowledge'
import { toast } from '@/lib/toast'
import { useRoute, useRouter } from 'vue-router'
import KnowledgeQaPanel from '@/components/ai/KnowledgeQaPanel.vue'

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

const canSave = computed(() => draft.title.trim().length > 0 && draft.topic.trim().length > 0)

function chooseType(type: KnowledgeType) {
  draftType.value = type
  draft.title = ''
  draft.topic = ''
  draft.tagsText = ''
  draft.mastery = ''
  draft.content = CONTENT_TEMPLATES[type]
  createOpen.value = false
  editingId.value = null
  editorOpen.value = true
}

function parseTags(text: string): string[] {
  const tags = text
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
  return [...new Set(tags)]
}

// 保存
function save() {
  if (!canSave.value) return
  if (editingId.value) {
    clearSaveTimer()
    persistDraft()
    return
  }
  saveNew()
}

// 保存（新建）
function saveNew() {
  if (editingId.value) return
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

const editingId = ref<string | null>(null)

const isEditing = computed(() => editingId.value !== null)

const drawerTitle = computed(
  () => `${isEditing.value ? '编辑' : '新建'}${TYPE_LABELS[draftType.value]}`,
)

const drawerHint = computed(() =>
  isEditing.value ? '修改后点保存生效。' : TYPE_HINTS[draftType.value],
)

// 开始编辑幅值
function startEdit(item: KnowledgeItem) {
  hydrating = true
  dirty = false
  saveState.value = 'idle'

  editingId.value = item.id
  draftType.value = item.type
  draft.title = item.title
  draft.topic = item.topic
  draft.tagsText = item.tags.join(', ')
  draft.mastery = item.mastery ?? ''
  draft.content = item.content
  editorOpen.value = true

  nextTick(() => {
    hydrating = false
  })
}

type SaveState = 'idle' | 'saving' | 'saved' | 'invalid'

// 自动保存延迟时间
const AUTOSAVE_DELAY = 600

const saveState = ref<SaveState>('idle')
let saveTimer: ReturnType<typeof setTimeout> | undefined
let hydrating = false
let dirty = false //记录是否有未更新的数据

const saveStateText = computed(() => {
  if (saveState.value === 'saving') return '正在保存…'
  if (saveState.value === 'saved') return '已保存'
  if (saveState.value === 'invalid') return '标题和主题不能为空'
  return ''
})

// 清除计时器
function clearSaveTimer() {
  if (saveTimer !== undefined) {
    clearTimeout(saveTimer)
    saveTimer = undefined
  }
}

// 更新数据
function persistDraft() {
  if (!editingId.value || !canSave.value) {
    saveState.value = 'invalid'
    return
  }

  const item = updateKnowledge(editingId.value, {
    title: draft.title.trim(),
    topic: draft.topic.trim(),
    content: draft.content,
    tags: parseTags(draft.tagsText),
    mastery: draft.mastery || undefined,
  })
  if (!item) return

  dirty = false
  saveState.value = 'saved'
}

// 自动保存
function scheduleSave() {
  if (!isEditing.value || !editorOpen.value) return

  if (!canSave.value) {
    clearSaveTimer()
    saveState.value = 'invalid'
    return
  }

  saveState.value = 'saving'
  clearSaveTimer()
  saveTimer = setTimeout(() => {
    saveTimer = undefined
    persistDraft()
  }, AUTOSAVE_DELAY)
}

watch(draft, () => {
  if (hydrating) return
  if (!isEditing.value) return
  dirty = true
  scheduleSave()
})

watch(editorOpen, (open) => {
  if (open) return
  clearSaveTimer()
  const discarded = dirty && !canSave.value
  if (dirty && canSave.value) persistDraft()
  saveState.value = 'idle'
  dirty = false

  if (discarded) {
    toast.add({
      title: '修改未保存',
      description: '标题或主题为空，已丢弃本次修改',
      status: 'error',
      duration: 3000,
    })
  }
})

onBeforeUnmount(() => {
  clearSaveTimer()
  if (dirty) persistDraft()
})

const deleteOpen = ref(false) // 删除弹窗开启状态
const deleteTargetId = ref<string | null>(null)

const deleteTarget = computed(
  () => db.knowledge.find((item) => item.id === deleteTargetId.value) ?? null,
)

// 唤醒删除弹窗
function askDelete(item: KnowledgeItem) {
  deleteTargetId.value = item.id
  deleteOpen.value = true
}

// 确认删除
function confirmDelete() {
  if (!deleteTargetId.value) return

  const item = removeKnowledge(deleteTargetId.value)
  deleteOpen.value = false
  deleteTargetId.value = null

  if (item && selectedId.value === item.id) {
    selectedId.value = null
  }

  if (item) {
    toast.add({ title: '已删除', description: item.title, duration: 3000 })
  }
}

// 置顶
function togglePin(item: KnowledgeItem | null): void {
  if (!item) return

  const updated = toggleKnowledgePin(item.id)
  if (!updated) {
    toast.add({
      title: '条目不存在',
      description: '可能已经被删除',
      status: 'error',
      duration: 3000,
    })
  }
}

const keyword = ref('')
const masteryFilter = ref<MasteryFilter>('all')

const items = computed(() =>
  sortKnowledge(
    filterKnowledge(db.knowledge, {
      type: filter.value,
      keyword: keyword.value,
      mastery: masteryFilter.value,
      tags: [...activeTags.value],
      topic: topicFilter.value ?? undefined,
    }),
  ),
)

// 重置搜索参数
function clearFilters() {
  filter.value = 'all'
  keyword.value = ''
  masteryFilter.value = 'all'
  activeTags.value = []
  clearTopic()
}

const activeTags = ref<string[]>([])

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const item of db.knowledge) {
    for (const tag of item.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
})

// 标签搜索开关
function toggleTag(tag: string) {
  const index = activeTags.value.indexOf(tag)
  if (index === -1) {
    activeTags.value.push(tag)
  } else {
    activeTags.value.splice(index, 1)
  }
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  clearSaveTimer()

  if (dirty && canSave.value) {
    persistDraft()
  }

  if (saveState.value === 'invalid') {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  clearSaveTimer()
  if (dirty && canSave.value) persistDraft()
})

const route = useRoute()
const router = useRouter()

const topicFilter = ref<string | null>(
  typeof route.query.topic === 'string' ? route.query.topic : null,
)

watch(
  () => route.query.topic,
  (value) => {
    topicFilter.value = typeof value === 'string' ? value : null
  },
)

function clearTopic() {
  topicFilter.value = null
  router.replace({ query: {} })
}

watch(
  () => route.query.item,
  (id) => {
    if (typeof id !== 'string') return

    const item = db.knowledge.find((entry) => entry.id === id)
    if (!item) return

    selectedId.value = item.id
    filter.value = 'all'
    router.replace({ query: { ...route.query, item: undefined } })
  },
  { immediate: true },
)

const detailTab = ref<'content' | 'qa'>('content')

watch(selectedId, () => {
  detailTab.value = 'content'
})
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
  flex-wrap: wrap;
  gap: 2px;
  width: fit-content;
  padding: 3px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.tab {
  height: 26px;
  padding: 0 var(--space-4);
  border: none;
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
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-weight: 600;
  box-shadow: var(--shadow-card);
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

.detail-tabs {
  display: flex;
  gap: 4px;
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.detail-tab {
  height: 38px;
  padding: 0 var(--space-3);
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.detail-tab:hover {
  color: var(--color-text-strong);
}

.detail-tab.active {
  color: var(--color-text-strong);
  border-bottom-color: var(--color-text-strong);
}

.detail-tab:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
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

.detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
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

.detail-index {
  margin: var(--space-5);
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

.save-state {
  margin-right: auto;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.save-state[data-state='saved'] {
  color: var(--color-tone-sage-fg);
}

.save-state[data-state='invalid'] {
  color: var(--color-danger);
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pin-btn[aria-pressed='true'] {
  background: var(--color-accent-soft);
  color: var(--color-tone-lime-fg);
}

.danger-text {
  color: var(--color-danger);
}

.confirm-text {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-5) var(--space-4);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 36px;
  margin: 0;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--color-text-faint);
}

.search:focus-within {
  border-color: var(--color-accent-strong);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-sm);
}

.search-input::placeholder {
  color: var(--color-text-faint);
}

.search-clear {
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--color-text-faint);
  cursor: pointer;
}

.search-clear:hover {
  background: var(--color-surface);
  color: var(--color-text-strong);
}

.search-clear:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 1px;
}

input[type='search']::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}

.filter-label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.mastery-select {
  width: 150px;
  height: 28px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-xs);
}

.mastery-select:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
}

.tag-chip {
  flex: none;
  height: 22px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-2xs);
  white-space: nowrap;
  cursor: pointer;
}

.tag-chip:hover {
  border-color: var(--color-accent-strong);
  color: var(--color-text-strong);
}

.tag-chip.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-strong);
  color: var(--color-tone-lime-fg);
}

.tag-chip:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.active-topic {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  align-self: flex-start;
  height: 26px;
  padding: 0 var(--space-2) 0 var(--space-3);
  border: 1px solid var(--color-accent-strong);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-tone-lime-fg);
  font-size: var(--text-xs);
}

.active-topic-clear {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-circle);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.active-topic-clear:hover {
  background: rgb(23 26 22 / 0.08);
}
</style>
