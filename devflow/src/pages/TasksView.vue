<template>
  <section class="tasks">
    <header class="page-head">
      <div>
        <p class="eyebrow">TASKS</p>
        <h1>任务</h1>
      </div>
      <p class="summary">
        {{ openCount }} 项待办
        <template v-if="overdueCount > 0"> · {{ overdueCount }} 项逾期 </template>
      </p>
    </header>

    <!-- 添加任务 -->
    <form class="quick-add" @submit.prevent="submitTask">
      <Plus :size="14" aria-hidden="true" />
      <input
        ref="inputEl"
        v-model="draft"
        type="text"
        placeholder="添加任务，按回车创建"
        aria-label="新任务标题"
        enterkeyhint="done"
      />
    </form>

    <!-- 筛选 -->
    <div class="filters" role="group" aria-label="任务筛选">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        type="button"
        :class="['filter', { active: filter === f.value }]"
        :aria-pressed="filter === f.value"
        @click="filter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <Card v-if="db.tasks.length === 0" class="empty">
      <div class="empty-body">
        <p class="empty-title">还没有任务</p>
        <p class="empty-text">在上方输入框写下第一件事，或者先载入示例数据。</p>
        <Button variant="lime" @click="focusInput">新建第一条</Button>
        <Button variant="ghost" @click="loadSeed">载入示例数据</Button>
      </div>
    </Card>

    <Card v-else-if="groups.length === 0" class="empty">
      <div class="empty-body">
        <p class="empty-title">这个范围没有任务</p>
        <p class="empty-text">「{{ FILTERS.find((f) => f.value === filter)?.label }}」里是空的。</p>
        <Button variant="lime" @click="filter = 'all'">清除筛选</Button>
      </div>
    </Card>

    <!-- 任务组 -->
    <div v-else class="groups">
      <template v-for="group in groups" :key="group.key">
        <section class="group">
          <!-- 已完成 -->
          <button
            v-if="group.key === 'done'"
            type="button"
            class="group-label toggle"
            :aria-expanded="doneOpen"
            @click="doneOpen = !doneOpen"
          >
            <ChevronRight :size="12" :class="['chev', { open: doneOpen }]" aria-hidden="true" />
            <span>{{ group.label }}</span>
            <span class="count">{{ group.tasks.length }}</span>
            <span class="line" />
          </button>

          <!-- 未完成 -->
          <h2 v-else class="group-label">
            <span>{{ group.label }}</span>
            <span class="count">{{ group.tasks.length }}</span>
            <span class="line" />
          </h2>

          <!-- 未完成项或已完成展开项 -->
          <ul v-if="group.key !== 'done' || doneOpen" class="list">
            <li
              v-for="task in group.tasks"
              :key="task.id"
              :class="['row', { done: task.done, overdue: isOverdue(task, today) }]"
              @click="onRowClick($event, task)"
            >
              <label class="check-wrap">
                <input
                  class="check-input"
                  type="checkbox"
                  :checked="task.done"
                  :aria-label="task.done ? `取消完成：${task.title}` : `完成：${task.title}`"
                  @change="handleToggle(task)"
                />
                <span class="check" aria-hidden="true">
                  <Check v-if="task.done" :size="12" :stroke-width="2.6" />
                </span>
              </label>

              <div class="copy">
                <p class="title">{{ task.title }}</p>
                <div class="meta">
                  <Chip :tone="CATEGORY_TONES[task.category]">
                    {{ CATEGORY_LABELS[task.category] }}
                  </Chip>
                  <span v-if="task.estimateMin" class="meta-item">
                    {{ task.estimateMin }} 分钟
                  </span>
                  <time class="meta-item" :datetime="task.date">{{ task.date }}</time>
                </div>
              </div>

              <div class="row-end">
                <span :class="['priority', task.priority.toLowerCase()]">{{ task.priority }}</span>
                <!-- 编辑 -->
                <button
                  type="button"
                  class="row-action"
                  :aria-label="`编辑任务：${task.title}`"
                  @click="openEditor(task)"
                >
                  <Pencil :size="14" aria-hidden="true" />
                </button>

                <!-- 删除 -->
                <button
                  type="button"
                  class="row-action danger"
                  :aria-label="`删除任务：${task.title}`"
                  @click="handleDelete(task)"
                >
                  <Trash2 :size="14" aria-hidden="true" />
                </button>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </div>

    <!-- 编辑抽屉 -->
    <AppDrawer v-model:open="drawerOpen" title="编辑任务" description="修改后点保存生效">
      <form id="task-form" class="form" @submit.prevent="save">
        <label class="field">
          <span class="field-label">标题</span>
          <input v-model="editft.title" class="input" type="text" required />
        </label>

        <label class="field">
          <span class="field-label">备注</span>
          <textarea v-model="editft.note" class="input textarea" rows="3" />
        </label>

        <div class="field-row">
          <label class="field">
            <span class="field-label">日期</span>
            <input v-model="editft.date" class="input" type="date" />
          </label>

          <label class="field">
            <span class="field-label">估时（分钟）</span>
            <input
              v-model.number="editft.estimateMin"
              class="input"
              type="number"
              min="0"
              step="1"
            />
          </label>
        </div>

        <div class="field-row">
          <label class="field">
            <span class="field-label">分类</span>
            <select v-model="editft.category" class="input">
              <option value="learning">学习</option>
              <option value="job">求职</option>
              <option value="project">项目</option>
              <option value="life">生活</option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">优先级</span>
            <select v-model="editft.priority" class="input">
              <option value="P0">P0 · 今天必须</option>
              <option value="P1">P1 · 本周</option>
              <option value="P2">P2 · 有空再说</option>
            </select>
          </label>
        </div>
      </form>

      <template #footer>
        <Button variant="ghost" @click="drawerOpen = false">取消</Button>
        <Button variant="lime" type="submit" form="task-form" :disabled="!canSave">保存</Button>
      </template>
    </AppDrawer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { Check, ChevronRight, Trash2, Pencil, Plus } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import { localDate } from '@/lib/date'
import { groupTasks, isOverdue, filterTasks, type TaskFilter } from '@/lib/tasks'
import { loadSeed, useDatabase } from '@/stores/db'
import type { TaskCategory, Task, Priority } from '@/types'
import { addTask, toggleTask, removeTask, restoreTask, updateTask } from '@/stores/tasks'
import { toast } from '@/lib/toast'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import { useRouter } from 'vue-router'
import { CATEGORY_LABELS, CATEGORY_TONES } from '@/lib/task-meta'

const db = useDatabase()
const today = localDate()
const doneOpen = ref(false)

const openCount = computed(() => db.tasks.filter((task) => !task.done).length)
const overdueCount = computed(() => db.tasks.filter((task) => isOverdue(task, today)).length)

const draft = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

// 新增任务
function submitTask() {
  const task = addTask(draft.value)
  if (!task) return
  draft.value = ''
}

// 输入框聚焦
function focusInput() {
  inputEl.value?.focus()
}

// 完成/取消完成任务
const router = useRouter()

function handleToggle(task: Task) {
  const willBeDone = !task.done
  toggleTask(task.id)

  if (willBeDone) {
    toast.add({
      title: '已完成',
      description: task.title,
      status: 'success',
      duration: 8000,
      actionProps: {
        label: '撤销',
        altText: '撤销完成',
        onClick: () => toggleTask(task.id),
      },
      data: {
        secondaryAction: {
          label: '记录学习',
          onClick: () =>
            router.push({
              path: '/insights',
              query:
                task.estimateMin && task.estimateMin > 0
                  ? { log: '1', estimateMin: String(task.estimateMin) }
                  : { log: '1' },
            }),
        },
      },
    })
  }
}

// 删除任务
function handleDelete(task: Task) {
  const removed = removeTask(task.id)
  if (!removed) return

  toast.add({
    title: '已删除',
    description: removed.task.title,
    duration: 5000,
    actionProps: {
      label: '撤销',
      altText: '撤销删除',
      onClick: () => restoreTask(removed),
    },
  })
}

interface TaskEditft {
  title: string
  note: string
  date: string
  category: TaskCategory
  priority: Priority
  estimateMin: number | null
}

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const editft = reactive<TaskEditft>({
  title: '',
  note: '',
  date: localDate(),
  category: 'project',
  priority: 'P2',
  estimateMin: null,
})

const canSave = computed(() => editft.title.trim().length > 0 && editft.date.length > 0)

// 编辑对象
function openEditor(task: Task) {
  editingId.value = task.id
  editft.title = task.title
  editft.note = task.note ?? ''
  editft.date = task.date
  editft.category = task.category
  editft.priority = task.priority
  editft.estimateMin = task.estimateMin ?? null
  drawerOpen.value = true
}

// 保存更新
function save() {
  if (!editingId.value || !canSave.value) return

  updateTask(editingId.value, {
    title: editft.title.trim(),
    note: editft.note.trim() || undefined,
    date: editft.date,
    category: editft.category,
    priority: editft.priority,
    estimateMin: editft.estimateMin && editft.estimateMin > 0 ? editft.estimateMin : undefined,
  })

  drawerOpen.value = false
  toast.add({
    title: '已保存',
    description: editft.title.trim(),
    status: 'success',
    duration: 3000,
  })
}

// 整行鼠标点击
function onRowClick(event: MouseEvent, task: Task) {
  const target = event.target as HTMLElement
  if (target.closest('button, input, label, a, select, textarea')) return
  openEditor(task)
}

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'all', label: '全部' },
]

const filter = ref<TaskFilter>('today')

const filtered = computed(() => filterTasks(db.tasks, filter.value, today))
const groups = computed(() => groupTasks(filtered.value, today))
</script>

<style scoped>
.tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
}

.eyebrow {
  margin: 0 0 var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  color: var(--color-text-faint);
}

h1 {
  margin: 0;
  font-size: var(--text-xl);
  color: var(--color-text-strong);
}

.summary {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.group-label {
  width: 100%;
  height: 32px;
  padding: 0 var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.09em;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.toggle {
  cursor: pointer;
}

.chev {
  transition: transform 160ms ease;
}

.chev.open {
  transform: rotate(90deg);
}

.count {
  color: var(--color-text-faint);
}

.line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.list {
  margin: 0;
  padding: 0 var(--space-3) var(--space-2);
  list-style: none;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-4);
  border-radius: var(--radius-sm);
}

.row + .row {
  border-top: 1px solid var(--color-border);
  border-radius: 0;
}

.row:hover {
  background: var(--color-background);
}

.row.overdue .meta-item:last-child {
  color: var(--color-danger);
  font-weight: 600;
}

.row.done .title {
  color: var(--color-text-faint);
  text-decoration: line-through;
}

.check {
  flex: none;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  color: var(--color-accent-contrast);
  background: var(--color-background);
}

.row.done .check {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.copy {
  flex: 1;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text);
}

.meta {
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-faint);
}

.meta-item {
  color: var(--color-text-faint);
}

.priority {
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 600;
}

.priority.p0 {
  color: var(--color-tone-coral-fg);
}

.priority.p1 {
  color: var(--color-tone-amber-fg);
}

.priority.p2 {
  color: var(--color-text-faint);
}

.empty-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-8);
}

.empty-title {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.empty-text {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.quick-add {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 44px;
  padding: 0 var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-faint);
}

.quick-add:focus-within {
  border-color: var(--color-accent-strong);
}

.quick-add input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-base);
}

.quick-add input::placeholder {
  color: var(--color-text-faint);
}

.check-wrap {
  position: relative;
  flex: none;
  display: inline-flex;
  margin-top: 2px;
}

.check-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
}

.check-input:focus-visible + .check {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.row-end {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 2px;
}

.row-action {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-faint);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 120ms ease,
    color 120ms ease;
}

.row:hover .row-action {
  opacity: 1;
}

.row-action:hover {
  background: var(--color-background);
  color: var(--color-text-strong);
}

.row-action.danger:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.row-action:focus-visible {
  opacity: 1;
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

@media (hover: none) {
  .row-action {
    opacity: 1;
  }
}

.filters {
  display: inline-flex;
  align-self: flex-start;
  gap: var(--space-1);
  padding: 3px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.filter {
  height: 28px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.filter:hover {
  color: var(--color-text-strong);
}

.filter.active {
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-weight: 600;
  box-shadow: var(--shadow-card);
}

.filter:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}
</style>
