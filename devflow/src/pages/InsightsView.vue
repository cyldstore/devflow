<template>
  <section class="insights">
    <header class="page-head">
      <div>
        <p class="eyebrow">INSIGHTS</p>
        <h1>复盘</h1>
      </div>

      <div class="range-toggle" role="group" aria-label="时间范围">
        <button
          v-for="item in RANGES"
          :key="item.value"
          type="button"
          :class="['range-btn', { active: range === item.value }]"
          :aria-pressed="range === item.value"
          @click="range = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </header>

    <p class="range-hint">{{ startDate }} ~ {{ today }} · 共 {{ range }} 天</p>

    <Card v-if="!summary.hasActivity" class="empty">
      <div class="empty-body">
        <p class="empty-title">这段时间还没有记录</p>
        <p class="empty-text">完成任务或记一笔学习之后，这里会自动汇总。</p>
        <Button variant="lime" @click="goTasks">去任务页</Button>
      </div>
    </Card>

    <div v-else class="kpi-grid">
      <Card v-for="card in kpiCards" :key="card.label" class="kpi">
        <p class="kpi-label">{{ card.label }}</p>
        <p class="kpi-value">{{ card.value }}</p>
        <p v-if="card.hint" class="kpi-hint">{{ card.hint }}</p>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { localDate } from '@/lib/date'
import { formatMinutes } from '@/lib/format'
import { rangeDates, summarize } from '@/lib/insights'
import type { InsightRange } from '@/lib/insights'
import { useDatabase } from '@/stores/db'

const RANGES: { value: InsightRange; label: string }[] = [
  { value: 7, label: '最近 7 天' },
  { value: 30, label: '最近 30 天' },
]

const router = useRouter()
const db = useDatabase()
const today = localDate()

const range = ref<InsightRange>(7)

const summary = computed(() => summarize(db, range.value, today))
const startDate = computed(() => rangeDates(today, range.value)[0])

const kpiCards = computed(() => {
  const kpis = summary.value.kpis
  const perDay = Math.round(kpis.studyMinutes / range.value)

  return [
    { label: '完成任务', value: `${kpis.completedTasks} 项` },
    { label: '学习时长', value: formatMinutes(kpis.studyMinutes), hint: `日均 ${perDay} 分钟` },
    { label: '投递', value: `${kpis.applications} 个` },
    { label: '面试', value: `${kpis.interviews} 场` },
  ]
})

function goTasks() {
  router.push('/tasks')
}
</script>

<style scoped>
.insights {
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

.range-toggle {
  display: inline-flex;
  gap: var(--space-1);
  padding: 3px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.range-btn {
  height: 28px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
}

.range-btn.active {
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-weight: 600;
  box-shadow: var(--shadow-card);
}

.range-btn:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.range-hint {
  margin: calc(-1 * var(--space-3)) 0 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.kpi {
  padding: var(--space-5);
}

.kpi-label {
  margin: 0 0 var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.kpi-value {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
}

.kpi-hint {
  margin: var(--space-2) 0 0;
  font-size: var(--text-2xs);
  color: var(--color-text-muted);
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
  max-width: 460px;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}
</style>
