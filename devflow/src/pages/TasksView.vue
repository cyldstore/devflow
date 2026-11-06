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

    <Card v-if="groups.length === 0" class="empty">
      <div class="empty-body">
        <p class="empty-title">还没有任务</p>
        <p class="empty-text">先载入一组示例数据看看效果，或者等下一步加上新建。</p>
        <Button variant="lime" @click="loadSeed">载入示例数据</Button>
      </div>
    </Card>

    <div v-else class="groups">
      <template v-for="group in groups" :key="group.key">
        <section class="group">
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

          <h2 v-else class="group-label">
            <span>{{ group.label }}</span>
            <span class="count">{{ group.tasks.length }}</span>
            <span class="line" />
          </h2>

          <ul v-if="group.key !== 'done' || doneOpen" class="list">
            <li
              v-for="task in group.tasks"
              :key="task.id"
              :class="['row', { done: task.done, overdue: isOverdue(task, today) }]"
            >
              <span class="check" aria-hidden="true">
                <Check v-if="task.done" :size="12" :stroke-width="2.6" />
              </span>

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

              <span :class="['priority', task.priority.toLowerCase()]">{{ task.priority }}</span>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ChevronRight } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import { localDate } from '@/lib/date'
import { groupTasks, isOverdue } from '@/lib/tasks'
import { loadSeed, useDatabase } from '@/stores/db'
import type { TaskCategory } from '@/types'

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  learning: '学习',
  job: '求职',
  project: '项目',
  life: '生活',
}

const CATEGORY_TONES = {
  learning: 'sage',
  job: 'blue',
  project: 'wood',
  life: 'stone',
} as const

const db = useDatabase()
const today = localDate()
const doneOpen = ref(false)

const groups = computed(() => groupTasks(db.tasks, today))
const openCount = computed(() => db.tasks.filter((task) => !task.done).length)
const overdueCount = computed(() => db.tasks.filter((task) => isOverdue(task, today)).length)
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
  margin-top: 2px;
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
</style>
