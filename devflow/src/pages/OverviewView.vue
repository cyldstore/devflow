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

    <div class="ov-grid">
      <div class="ov-main">
        <!-- 逾期卡片 -->
        <Card v-if="overdueTasks.length > 0" class="overdue-card">
          <header class="block-head">
            <h2 class="block-title">逾期 {{ overdueTasks.length }} 项</h2>
          </header>

          <ul class="overdue-list">
            <li v-for="task in overdueTasks" :key="task.id" class="overdue-row">
              <span class="overdue-title">{{ task.title }}</span>
              <time class="overdue-date" :datetime="task.date">{{ task.date }}</time>
              <button type="button" class="overdue-move" @click="moveToToday(task)">
                移到今天
              </button>
            </li>
          </ul>
        </Card>

        <!-- 今日聚焦卡片 -->
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
            <li
              v-for="task in focusTasks"
              :key="task.id"
              :class="['focus-row', { done: task.done }]"
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
                  <span v-if="task.estimateMin" class="meta-item">{{ task.estimateMin }} 分钟</span>
                </div>
              </div>

              <span :class="['priority', task.priority.toLowerCase()]">{{ task.priority }}</span>
            </li>
          </ul>
        </Card>

        <!-- 记录图表 -->
        <Card class="chart-card">
          <header class="side-head">
            <div>
              <h2 class="block-title">学习投入</h2>
              <p class="block-sub">最近 7 天 · 分钟</p>
            </div>
          </header>

          <BaseChart v-if="week7.kpis.studyMinutes > 0" :option="studyOption" :height="200" />
          <p v-else class="chart-empty">最近 7 天没有学习记录</p>
        </Card>
      </div>

      <aside class="ov-side">
        <!-- 目标卡片 -->
        <Card class="goal-card">
          <header class="side-head">
            <div>
              <h2 class="block-title">本周学习</h2>
              <p class="block-sub">目标 {{ goalHours }} 小时</p>
            </div>
            <div class="goal-meta">
              <span class="goal-percent">{{ goalPercent }}%</span>
              <button type="button" class="goal-edit" @click="openSettings">编辑</button>
            </div>
          </header>

          <p class="goal-value">
            {{ weekHours }}
            <span class="goal-total">/ {{ goalHours }} 小时</span>
          </p>

          <div class="goal-bar" aria-hidden="true">
            <span class="goal-fill" :style="{ width: `${goalPercent}%` }" />
          </div>

          <p class="goal-hint">
            <template v-if="remainingMinutes > 0">还差 {{ remainingText }}</template>
            <template v-else>本周目标已完成</template>
            <template v-if="streak > 0"> · 连续 {{ streak }} 天</template>
          </p>
        </Card>

        <!-- 求职预览卡片 -->
        <Card class="side-card">
          <header class="side-head">
            <h2 class="block-title">接下来</h2>
            <RouterLink class="side-link" to="/jobs">全部 →</RouterLink>
          </header>

          <p v-if="upcoming.length === 0" class="side-empty">暂时没有待跟进的事项</p>

          <ul v-else class="side-list">
            <li v-for="app in upcoming" :key="app.id">
              <RouterLink class="side-row" :to="{ path: '/jobs', query: { app: app.id } }">
                <span class="side-title">{{ app.company }} · {{ app.role }}</span>
                <span :class="['side-sub', { overdue: isFollowUpOverdue(app, today) }]">
                  {{ app.nextAction?.label }} · {{ app.nextAction?.date }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </Card>

        <!-- 知识库预览卡片 -->
        <Card class="side-card">
          <header class="side-head">
            <h2 class="block-title">最近知识</h2>
            <RouterLink class="side-link" to="/knowledge">知识库 →</RouterLink>
          </header>

          <p v-if="recentKnowledge.length === 0" class="side-empty">还没有知识条目</p>

          <ul v-else class="side-list">
            <li v-for="item in recentKnowledge" :key="item.id">
              <RouterLink class="side-row" :to="{ path: '/knowledge', query: { item: item.id } }">
                <span class="side-title">{{ item.title }}</span>
                <span class="side-sub">{{ item.topic }} · {{ item.updatedAt.slice(0, 10) }}</span>
              </RouterLink>
            </li>
          </ul>
        </Card>
      </aside>
    </div>
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
import { sortTasks, startOfWeek } from '@/lib/tasks'
import { CATEGORY_LABELS, CATEGORY_TONES } from '@/lib/task-meta'
import { useDatabase } from '@/stores/db'
import { rescheduleTask, toggleTask } from '@/stores/tasks'
import { toast } from '@/lib/toast'
import type { Task } from '@/types'
import { minutesInRange, studyStreak, summarize } from '@/lib/insights'
import { formatMinutes } from '@/lib/format'
import { studyBarOption } from '@/lib/chart-options'
import BaseChart from '@/components/ui/BaseChart.vue'
import { isFollowUpOverdue } from '@/lib/jobs'
import { openSettings } from '@/stores/ui'

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

const weekStart = startOfWeek(today)

const weekMinutes = computed(() => minutesInRange(db.studyLogs, weekStart, today))
const weekHours = computed(() => (weekMinutes.value / 60).toFixed(1))
const goalHours = computed(() => db.profile.weeklyGoalHours || 0)

const goalPercent = computed(() => {
  if (goalHours.value <= 0) return 0
  return Math.min(100, Math.round((weekMinutes.value / (goalHours.value * 60)) * 100))
})

const remainingMinutes = computed(() => Math.max(0, goalHours.value * 60 - weekMinutes.value))
const remainingText = computed(() => formatMinutes(remainingMinutes.value))
const streak = computed(() => studyStreak(db.studyLogs, today))

const week7 = computed(() => summarize(db, 7, today))
const studyOption = computed(() =>
  studyBarOption(
    week7.value.studySeries.map((point) => point.date.slice(5)),
    week7.value.studySeries.map((point) => point.minutes),
  ),
)

const upcoming = computed(() =>
  db.applications
    .filter((app) => app.nextAction && app.stage !== 'closed')
    .sort((a, b) => (a.nextAction?.date ?? '').localeCompare(b.nextAction?.date ?? ''))
    .slice(0, 4),
)

const recentKnowledge = computed(() =>
  [...db.knowledge].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3),
)
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

.ov-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: var(--space-5);
  align-items: start;
}

.ov-main,
.ov-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
}

.side-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.chart-card,
.goal-card {
  padding: var(--space-5);
}

.goal-percent {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-tone-lime-fg);
}

.goal-value {
  margin: 0 0 var(--space-3);
  font-size: var(--text-2xl);
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
}

.goal-total {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--color-text-faint);
}

.goal-bar {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-background);
  overflow: hidden;
}

.goal-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-accent);
  transition: width 240ms ease;
}

.goal-hint {
  margin: var(--space-3) 0 0;
  font-size: var(--text-2xs);
  color: var(--color-text-muted);
}

.chart-empty {
  margin: 0;
  padding: var(--space-7) 0;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-faint);
}

@media (max-width: 1023px) {
  .ov-grid {
    grid-template-columns: 1fr;
  }
}

.side-card {
  padding: var(--space-5);
}

.side-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.side-link {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.side-link:hover {
  color: var(--color-text-strong);
}

.side-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.side-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3) 0;
  border-top: 1px solid var(--color-border);
}

.side-list li:first-child .side-row {
  border-top: none;
  padding-top: 0;
}

.side-row:hover .side-title {
  color: var(--color-tone-lime-fg);
}

.side-title {
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-sub {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.side-sub.overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.side-empty {
  margin: 0;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--color-text-faint);
}

.side-row:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}
.goal-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.goal-edit {
  border: none;
  background: transparent;
  color: var(--color-text-faint);
  font: inherit;
  font-size: var(--text-2xs);
  text-decoration: underline;
  cursor: pointer;
}

.goal-edit:hover {
  color: var(--color-text-strong);
}

.goal-edit:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}
</style>
