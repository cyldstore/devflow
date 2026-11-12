<template>
  <section class="overview">
    <header class="ov-head">
      <div>
        <p class="eyebrow">{{ dateLabel }}</p>
        <h1>{{ greeting }}，{{ displayName }}。</h1>
        <p class="lede">
          今天有 {{ openToday }} 件待办<template v-if="overdueTasks.length > 0">
            ，{{ overdueTasks.length }} 件已逾期</template
          >。
        </p>
      </div>

      <div class="ov-actions">
        <Button variant="ghost" @click="goLog">记录学习</Button>
        <Button variant="lime" @click="goTasks">新建任务</Button>
      </div>
    </header>

    <Card v-if="overdueTasks.length > 0" class="overdue-card">
      <header class="block-head">
        <h2 class="block-title">逾期 {{ overdueTasks.length }} 项</h2>
      </header>

      <ul class="overdue-list">
        <li v-for="task in overdueTasks" :key="task.id" class="overdue-row">
          <span class="overdue-title">{{ task.title }}</span>
          <time class="overdue-date" :datetime="task.date">{{ task.date }}</time>
          <button type="button" class="overdue-move" @click="moveToToday(task)">移到今天</button>
        </li>
      </ul>
    </Card>

    <Card class="focus-card">
      <header class="block-head">
        <div>
          <h2 class="block-title">今日聚焦</h2>
        </div>
        <span class="focus-count">{{ doneToday }} / {{ todayTasks.length }}</span>
      </header>

      <div v-if="todayTasks.length === 0" class="focus-empty">
        <p>今天还没有安排任务。</p>
        <Button variant="ghost" @click="goTasks">去任务页添加</Button>
      </div>

      <ul v-else class="focus-list">
        <li v-for="task in focusTasks" :key="task.id" :class="['focus-row', { done: task.done }]">
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
              <span v-if="task.estimateMin" class="meta-item">{{ task.estimateMin }} 分钟</span>
            </div>
          </div>

          <span :class="['priority', task.priority.toLowerCase()]">{{ task.priority }}</span>
        </li>
      </ul>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Check } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import { localDate } from '@/lib/date'
import { sortTasks } from '@/lib/tasks'
import { CATEGORY_LABELS, CATEGORY_TONES } from '@/lib/task-meta'
import { useDatabase } from '@/stores/db'
import { rescheduleTask, toggleTask } from '@/stores/tasks'
import { toast } from '@/lib/toast'
import type { Task } from '@/types'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const router = useRouter()
const db = useDatabase()
const today = localDate()

const dateLabel = computed(() => {
  const now = new Date()
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEKDAYS[now.getDay()]}`
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const displayName = computed(() => db.profile.name || '朋友')

const todayTasks = computed(() => db.tasks.filter((task) => task.date === today))
const openToday = computed(() => todayTasks.value.filter((task) => !task.done).length)
const doneToday = computed(() => todayTasks.value.filter((task) => task.done).length)

const focusTasks = computed(() =>
  sortTasks(todayTasks.value).sort((a, b) => Number(a.done) - Number(b.done)),
)

const overdueTasks = computed(() =>
  sortTasks(db.tasks.filter((task) => !task.done && task.date < today)),
)

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
          onClick: () => router.push({ path: '/insights', query: { log: '1' } }),
        },
      },
    })
  }
}

function moveToToday(task: Task) {
  rescheduleTask(task.id, today)
  toast.add({
    title: '已移到今天',
    description: task.title,
    status: 'success',
    duration: 3000,
  })
}

function goLog() {
  router.push({ path: '/insights', query: { log: '1' } })
}

function goTasks() {
  router.push('/tasks')
}
</script>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.ov-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
}

.eyebrow {
  margin: 0 0 var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  color: var(--color-text-faint);
}

h1 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-2xl);
  letter-spacing: -0.03em;
  color: var(--color-text-strong);
}

.lede {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.ov-actions {
  display: flex;
  gap: var(--space-2);
  flex: none;
}

.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.block-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--color-text-strong);
}

.focus-count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.overdue-card {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

.overdue-card .block-title {
  color: var(--color-danger);
}

.overdue-list {
  margin: 0;
  padding: 0 var(--space-3) var(--space-3);
  list-style: none;
}

.overdue-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
}

.overdue-row + .overdue-row {
  border-top: 1px solid rgb(232 93 58 / 0.2);
}

.overdue-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overdue-date {
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-danger);
}

.overdue-move {
  flex: none;
  height: 24px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-danger);
  font: inherit;
  font-size: var(--text-2xs);
  cursor: pointer;
}

.overdue-move:hover {
  background: var(--color-danger);
  color: #fff;
}

.overdue-move:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.focus-list {
  margin: 0;
  padding: 0 var(--space-3) var(--space-3);
  list-style: none;
}

.focus-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-sm);
}

.focus-row + .focus-row {
  border-top: 1px solid var(--color-border);
  border-radius: 0;
}

.focus-row:hover {
  background: var(--color-background);
}

.focus-row.done .title {
  color: var(--color-text-faint);
  text-decoration: line-through;
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

.check {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-background);
  color: var(--color-accent-contrast);
}

.check-input:focus-visible + .check {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.focus-row.done .check {
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

.focus-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-5) var(--space-8);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.focus-empty p {
  margin: 0;
}
</style>
