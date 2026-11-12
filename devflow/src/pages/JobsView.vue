<template>
  <section class="jobs">
    <header class="page-head">
      <div>
        <p class="eyebrow">JOBS</p>
        <h1>求职</h1>
      </div>
      <div class="head-actions">
        <p class="summary">
          {{ activeCount }} 个进行中
          <template v-if="overdueCount > 0"> · {{ overdueCount }} 个待跟进</template>
        </p>
        <Button variant="lime" @click="openAdd">
          <Plus :size="14" aria-hidden="true" />
          添加投递
        </Button>
      </div>
    </header>

    <!-- 移动端tab -->
    <div class="stage-tabs" role="group" aria-label="按阶段查看">
      <button
        v-for="stage in JOB_STAGES"
        :key="stage.value"
        type="button"
        :class="[
          'stage-tab',
          { active: activeStage === stage.value, overdue: hasOverdue(stage.value) },
        ]"
        :aria-pressed="activeStage === stage.value"
        @click="activeStage = stage.value"
      >
        {{ stage.label }}
        <span class="tab-count">{{ countOf(stage.value) }}</span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="board">
      <section
        v-for="column in columns"
        :key="column.stage"
        :class="[
          'column',
          {
            'drop-target': dragOverStage === column.stage,
            'stage-hidden': activeStage !== column.stage,
          },
        ]"
        @dragover.prevent="onDragOver(column.stage)"
        @dragleave="dragOverStage = null"
        @drop.prevent="onDrop(column.stage)"
      >
        <header class="column-head">
          <span class="column-title">
            <span class="stage-dot" :class="column.stage" aria-hidden="true" />
            {{ column.label }}
          </span>
          <span class="column-count">{{ column.applications.length }}</span>
        </header>

        <div class="column-body">
          <div
            v-for="app in column.applications"
            :key="app.id"
            :class="['card-wrap', { dragging: draggingId === app.id }]"
            draggable="true"
            @dragstart="onDragStart(app.id, $event)"
            @dragend="onDragEnd"
          >
            <button
              type="button"
              :class="['job-card', { overdue: isFollowUpOverdue(app, today) }]"
              @click="openDetail(app)"
            >
              <div class="job-top">
                <span class="company">{{ app.company }}</span>
                <span :class="['priority', app.priority.toLowerCase()]">{{ app.priority }}</span>
              </div>

              <p class="role">{{ app.role }}</p>

              <div v-if="app.city || app.salary" class="job-meta">
                <span v-if="app.city">{{ app.city }}</span>
                <span v-if="app.salary">{{ app.salary }}</span>
              </div>

              <p v-if="app.nextAction" class="next">
                <Calendar :size="11" aria-hidden="true" />
                {{ app.nextAction.label }} · {{ app.nextAction.date }}
              </p>
              <p v-else class="next muted">暂无下一步</p>
            </button>
          </div>

          <p v-if="column.applications.length === 0" class="column-empty">暂无</p>
        </div>
      </section>
    </div>

    <!-- 详情抽屉 -->
    <AppDrawer
      v-model:open="detailOpen"
      :title="selected?.company ?? ''"
      :description="selected?.role"
    >
      <template v-if="selected">
        <div class="detail-chips">
          <Chip :tone="STAGE_TONES[selected.stage]">
            {{ STAGE_LABELS[selected.stage] }}
          </Chip>
          <span :class="['priority', selected.priority.toLowerCase()]">{{
            selected.priority
          }}</span>
        </div>

        <dl class="facts">
          <div v-if="selected.city" class="fact">
            <dt>城市</dt>
            <dd>{{ selected.city }}</dd>
          </div>
          <div v-if="selected.salary" class="fact">
            <dt>薪资</dt>
            <dd>{{ selected.salary }}</dd>
          </div>
          <div v-if="selected.channel || selected.channelUrl" class="fact">
            <dt>渠道</dt>
            <dd>
              <a
                v-if="channelHref"
                :href="channelHref"
                class="channel-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ selected.channel || hostOf(channelHref) }}
                <ExternalLink :size="11" aria-hidden="true" />
              </a>
              <template v-else>{{ selected.channel }}</template>
            </dd>
          </div>
          <div v-if="selected.appliedAt" class="fact">
            <dt>投递日期</dt>
            <dd>{{ selected.appliedAt }}</dd>
          </div>
        </dl>

        <section class="block">
          <h3 class="block-title">下一步</h3>

          <template v-if="selected.nextAction">
            <div class="next-row">
              <span :class="['next-line', { overdue: isFollowUpOverdue(selected, today) }]">
                {{ selected.nextAction.label }} · {{ selected.nextAction.date }}
              </span>
              <Button variant="ghost" size="sm" @click="completeNextAction(selected.id)">
                完成
              </Button>
            </div>
            <p class="next-hint">完成后写入时间线，并清除这条待办。</p>
          </template>

          <form v-else class="next-form" @submit.prevent="saveNextAction(selected.id)">
            <input
              v-model="nextDraft.label"
              class="input"
              type="text"
              list="next-action-options"
              placeholder="下一步做什么"
            />
            <input v-model="nextDraft.date" class="input" type="date" />
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              :disabled="nextDraft.label.trim() === '' || nextDraft.date === ''"
            >
              设置
            </Button>
          </form>

          <datalist id="next-action-options">
            <option v-for="option in nextActionOptions" :key="option" :value="option" />
          </datalist>
        </section>

        <section v-if="selected.note" class="block">
          <h3 class="block-title">备注</h3>
          <p class="note-text">{{ selected.note }}</p>
        </section>

        <section class="block">
          <h3 class="block-title">时间线</h3>

          <ol v-if="timeline.length > 0" class="timeline">
            <li v-for="event in timeline" :key="event.id" :class="['event', event.type]">
              <span class="event-dot" aria-hidden="true" />
              <p class="event-text">{{ event.text }}</p>
              <p class="event-meta">{{ EVENT_LABELS[event.type] }} · {{ event.date }}</p>
            </li>
          </ol>

          <p v-else class="muted-line">还没有记录</p>
        </section>

        <section class="block">
          <h3 class="block-title">移动到阶段</h3>

          <div class="stage-actions">
            <button
              v-for="stage in JOB_STAGES"
              :key="stage.value"
              type="button"
              :class="['stage-btn', { active: selected.stage === stage.value }]"
              :aria-pressed="selected.stage === stage.value"
              @click="moveApplication(selected.id, stage.value)"
            >
              {{ stage.label }}
            </button>
          </div>
        </section>
      </template>
    </AppDrawer>

    <!-- 新增编辑抽屉 -->
    <AppDrawer v-model:open="addOpen" title="添加投递" description="先记下来，再决定要不要投。">
      <form id="application-form" class="form" @submit.prevent="saveApplication">
        <div class="field-row">
          <label class="field">
            <span class="field-label">公司（必填）</span>
            <input v-model="draft.company" class="input" type="text" required />
          </label>

          <label class="field">
            <span class="field-label">岗位（必填）</span>
            <input v-model="draft.role" class="input" type="text" required />
          </label>
        </div>

        <div class="field-row">
          <label class="field">
            <span class="field-label">城市</span>
            <input v-model="draft.city" class="input" type="text" />
          </label>

          <label class="field">
            <span class="field-label">薪资</span>
            <input v-model="draft.salary" class="input" type="text" placeholder="如 20-30K" />
          </label>
        </div>

        <div class="field-row">
          <label class="field">
            <span class="field-label">渠道</span>
            <input v-model="draft.channel" class="input" type="text" placeholder="官网 / 内推" />
          </label>

          <label class="field">
            <span class="field-label">渠道链接</span>
            <input
              v-model="draft.channelUrl"
              class="input"
              type="text"
              inputmode="url"
              placeholder="粘贴岗位页地址"
            />
          </label>

          <label class="field">
            <span class="field-label">优先级</span>
            <select v-model="draft.priority" class="input">
              <option value="P0">P0 · 最想去</option>
              <option value="P1">P1 · 重点</option>
              <option value="P2">P2 · 备选</option>
            </select>
          </label>
        </div>

        <p v-if="!channelUrlValid" class="field-hint">链接需要是 http:// 或 https:// 地址。</p>

        <div class="field-row">
          <label class="field">
            <span class="field-label">下一步动作</span>
            <input
              v-model="draft.nextLabel"
              class="input"
              type="text"
              placeholder="如 投递简历 / 等回复"
              list="new-next-actions"
            />
            <datalist id="new-next-actions">
              <option value="投递简历" />
              <option value="完善简历" />
              <option value="了解公司" />
            </datalist>
          </label>

          <label class="field">
            <span class="field-label">下一步日期</span>
            <input v-model="draft.nextDate" class="input" type="date" />
          </label>
        </div>

        <p v-if="!nextActionValid" class="field-hint">下一步动作和日期需要同时填写，或者都留空。</p>

        <label class="field">
          <span class="field-label">备注</span>
          <textarea v-model="draft.note" class="input textarea" rows="3" />
        </label>
      </form>

      <template #footer>
        <Button variant="ghost" @click="addOpen = false">取消</Button>
        <Button variant="lime" type="submit" form="application-form" :disabled="!canCreate">
          添加
        </Button>
      </template>
    </AppDrawer>
  </section>
</template>

<script setup lang="ts">
import { computed, watch, ref, reactive } from 'vue'
import { Calendar, Plus, ExternalLink } from 'lucide-vue-next'
import { groupApplications, isFollowUpOverdue, JOB_STAGES } from '@/lib/jobs'
import { localDate } from '@/lib/date'
import { useDatabase } from '@/stores/db'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import Chip from '@/components/ui/Chip.vue'
import type { JobStage, TimelineEvent, Priority } from '@/types'
import Button from '@/components/ui/Button.vue'
import {
  completeNextAction,
  setNextAction,
  createApplication,
  moveApplication,
} from '@/stores/applications'
import { toast } from '@/lib/toast'
import { normalizeHttpUrl, hostOf } from '@/lib/url'
import { useRoute, useRouter } from 'vue-router'

const db = useDatabase()
const today = localDate()

const columns = computed(() => groupApplications(db.applications))
const activeCount = computed(() => db.applications.filter((app) => app.stage !== 'closed').length)
const overdueCount = computed(
  () => db.applications.filter((app) => isFollowUpOverdue(app, today)).length,
)

const STAGE_LABELS = Object.fromEntries(
  JOB_STAGES.map((stage) => [stage.value, stage.label]),
) as Record<JobStage, string>

const STAGE_TONES = {
  saved: 'neutral',
  applied: 'blue',
  interview: 'amber',
  offer: 'lime',
  closed: 'stone',
} as const

const EVENT_LABELS: Record<TimelineEvent['type'], string> = {
  stage: '阶段变更',
  interview: '面试',
  followup: '跟进',
  note: '备注',
}

const detailOpen = ref(false)
const selectedId = ref<string | null>(null)

const selected = computed(() => db.applications.find((app) => app.id === selectedId.value) ?? null)

const timeline = computed(() => {
  if (!selected.value) return []

  return selected.value.timeline
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      // 按时间降序排序
      // 同一天按索引值降序排序
      const byDate = b.event.date.localeCompare(a.event.date)
      if (byDate !== 0) return byDate
      return b.index - a.index
    })
    .map(({ event }) => event)
})

function openDetail(app: { id: string }) {
  selectedId.value = app.id
  detailOpen.value = true
}

watch(detailOpen, (open) => {
  if (!open) selectedId.value = null
})

const addOpen = ref(false)

const draft = reactive({
  company: '',
  role: '',
  city: '',
  salary: '',
  channel: '',
  channelUrl: '',
  priority: 'P1' as Priority,
  nextLabel: '',
  nextDate: '',
  note: '',
})

const nextActionValid = computed(() => {
  const hasLabel = draft.nextLabel.trim() !== ''
  const hasDate = draft.nextDate !== ''
  return (hasLabel && hasDate) || (!hasLabel && !hasDate)
})

const canCreate = computed(
  () =>
    draft.company.trim() !== '' &&
    draft.role.trim() !== '' &&
    nextActionValid.value &&
    channelUrlValid.value,
)

// 初始化数据
function openAdd() {
  Object.assign(draft, {
    company: '',
    role: '',
    city: '',
    salary: '',
    channel: '',
    channelUrl: '',
    priority: 'P1',
    nextLabel: '',
    nextDate: '',
    note: '',
  })
  addOpen.value = true
}

// 保存
function saveApplication() {
  if (!canCreate.value) return

  const app = createApplication({
    company: draft.company,
    role: draft.role,
    city: draft.city,
    salary: draft.salary,
    channel: draft.channel,
    channelUrl: draft.channelUrl,
    priority: draft.priority,
    nextAction:
      draft.nextLabel.trim() && draft.nextDate
        ? { label: draft.nextLabel.trim(), date: draft.nextDate }
        : undefined,
    note: draft.note,
  })
  if (!app) return

  addOpen.value = false
  toast.add({
    title: '已添加投递',
    description: `${app.company} · ${app.role}`,
    status: 'success',
    duration: 3000,
  })
}

// 校验链接
const channelUrlValid = computed(() => {
  if (!draft.channelUrl.trim()) return true
  return normalizeHttpUrl(draft.channelUrl) !== null
})

const channelHref = computed(() => {
  const raw = selected.value?.channelUrl
  return raw ? normalizeHttpUrl(raw) : null
})

const draggingId = ref<string | null>(null)
const dragOverStage = ref<JobStage | null>(null)

function onDragStart(id: string, event: DragEvent) {
  draggingId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }
}

function onDragEnd() {
  draggingId.value = null
  dragOverStage.value = null
}

function onDragOver(stage: JobStage) {
  dragOverStage.value = stage
}

function onDrop(stage: JobStage) {
  if (!draggingId.value) return
  moveApplication(draggingId.value, stage)
  draggingId.value = null
  dragOverStage.value = null
}

const activeStage = ref<JobStage>(
  db.applications.find((app) => app.stage !== 'closed')?.stage ?? 'applied',
)

function countOf(stage: JobStage): number {
  return columns.value.find((column) => column.stage === stage)?.applications.length ?? 0
}

function hasOverdue(stage: JobStage): boolean {
  const column = columns.value.find((item) => item.stage === stage)
  return column ? column.applications.some((app) => isFollowUpOverdue(app, today)) : false
}

const route = useRoute()
const router = useRouter()

watch(
  () => route.query.app,
  (id) => {
    if (typeof id !== 'string') return

    const app = db.applications.find((item) => item.id === id)
    if (!app) return

    selectedId.value = app.id
    detailOpen.value = true
    router.replace({ query: { ...route.query, app: undefined } })
  },
  { immediate: true },
)

const NEXT_ACTIONS: Record<JobStage, string[]> = {
  saved: ['投递简历', '完善简历', '了解公司'],
  applied: ['跟进 HR', '等待回复', '准备笔试'],
  interview: ['准备面试', '参加面试', '复盘面试'],
  offer: ['确认 Offer', '比较机会'],
  closed: [],
}

const nextDraft = reactive({ label: '', date: '' })

const nextActionOptions = computed(() => (selected.value ? NEXT_ACTIONS[selected.value.stage] : []))

function saveNextAction(id: string) {
  if (!nextDraft.label.trim() || !nextDraft.date) return

  setNextAction(id, { label: nextDraft.label.trim(), date: nextDraft.date })
  nextDraft.label = ''
  nextDraft.date = ''
}

watch(selectedId, () => {
  nextDraft.label = ''
  nextDraft.date = ''
})
</script>

<style scoped>
.jobs {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
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

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.summary {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.column {
  min-width: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-background);
}

.column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) var(--space-3);
}

.column-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stage-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  background: var(--color-text-faint);
}

.stage-dot.applied {
  background: var(--color-tone-blue-fg);
}

.stage-dot.interview {
  background: var(--color-tone-amber-fg);
}

.stage-dot.offer {
  background: var(--color-tone-lime-fg);
}

.stage-dot.closed {
  background: var(--color-tone-stone-fg);
}

.column-count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.job-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.job-card.overdue {
  border-color: var(--color-danger);
}

.job-card:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.job-card:hover {
  border-color: var(--color-line-strong, var(--color-border));
}

.job-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.company {
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--color-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.job-meta {
  display: flex;
  gap: var(--space-2);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.next {
  margin: var(--space-1) 0 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-2xs);
  color: var(--color-text-muted);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.next.muted {
  color: var(--color-text-faint);
}

.job-card.overdue .next {
  color: var(--color-danger);
  font-weight: 600;
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

.column-empty {
  margin: 0;
  min-height: 72px;
  display: grid;
  place-items: center;
  padding: var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--color-text-faint);
}

.detail-chips {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin: 0 0 var(--space-6);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fact dt {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.fact dd {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.channel-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-tone-lime-fg);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.channel-link:hover {
  color: var(--color-accent-strong);
}

.block {
  margin-bottom: var(--space-6);
}

.block-title {
  margin: 0 0 var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.next-line {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.next-line.overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.muted-line {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-faint);
}

.note-text {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
  white-space: pre-wrap;
}

.timeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.event {
  position: relative;
  padding: 0 0 var(--space-5) var(--space-6);
}

.event::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 5px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-circle);
  background: var(--color-text-faint);
}

.event::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 15px;
  bottom: 0;
  width: 1px;
  background: var(--color-border);
}

.event:last-child {
  padding-bottom: 0;
}

.event:last-child::after {
  display: none;
}

.event.stage::before {
  background: var(--color-accent-strong);
}

.event.interview::before {
  background: var(--color-tone-amber-fg);
}

.event.followup::before {
  background: var(--color-tone-blue-fg);
}

.event.note::before {
  background: var(--color-text-faint);
}

.event-text {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.event-meta {
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.card-wrap {
  cursor: grab;
}

.card-wrap.dragging {
  opacity: 0.45;
  cursor: grabbing;
}

.column.drop-target {
  border-color: var(--color-accent-strong);
  background: var(--color-accent-soft);
  outline: 2px solid var(--color-accent-strong);
  outline-offset: -1px;
}

.stage-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.stage-btn {
  height: 30px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
}

.stage-btn:hover {
  border-color: var(--color-accent-strong);
  color: var(--color-text-strong);
}

.stage-btn.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-strong);
  color: var(--color-tone-lime-fg);
  font-weight: 600;
}

.stage-btn:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.stage-tabs {
  display: none;
  gap: var(--space-1);
  overflow-x: auto;
  padding-bottom: var(--space-2);
}

.stage-tab {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 30px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-xs);
  white-space: nowrap;
  cursor: pointer;
}

.stage-tab.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent-strong);
  color: var(--color-tone-lime-fg);
  font-weight: 600;
}

.stage-tab.overdue .tab-count {
  color: var(--color-danger);
  font-weight: 600;
}

.stage-tab:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.tab-count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.next-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.next-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px auto;
  gap: var(--space-2);
  align-items: center;
}

.next-form .input {
  height: 32px;
  font-size: var(--text-sm);
}

.next-hint {
  margin: var(--space-2) 0 0;
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

/* 小于768采用tab切换 */
@media (max-width: 767px) {
  .stage-tabs {
    display: flex;
  }

  .board {
    display: block;
  }

  .column {
    margin-bottom: var(--space-4);
  }

  .stage-hidden {
    display: none;
  }
}

/* 大于768采用行布局 */
@media (min-width: 768px) {
  .board {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .column {
    flex: none;
  }

  .column-body {
    flex: none;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: var(--space-2);
    overscroll-behavior-x: contain;

    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  .column-body:hover {
    scrollbar-color: var(--color-line-strong) transparent;
  }

  .column-body::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .column-body::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: var(--radius-pill);
  }

  .column-body:hover::-webkit-scrollbar-thumb {
    background: var(--color-line-strong);
  }

  .card-wrap {
    flex: 0 0 220px;
  }

  .column-empty {
    flex: 0 0 160px;
    min-height: 72px;
  }
}

/* 大于1320采用列布局 */
@media (min-width: 1000px) {
  .jobs {
    height: 100%;
    min-height: 0;
  }

  .page-head {
    flex: none;
  }

  .board {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    gap: var(--space-4);
    align-items: stretch;
    overflow: hidden;
  }

  .column {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .column-head {
    flex: none;
  }

  .column-body {
    flex: 1;
    min-height: 0;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 0;
  }

  .card-wrap {
    flex: none;
  }

  .column-empty {
    flex: 1;
    min-height: 72px;
  }
}
</style>
