<template>
  <section class="insights">
    <header class="page-head">
      <div>
        <p class="eyebrow">INSIGHTS</p>
        <h1>复盘</h1>
      </div>

      <div class="head-actions">
        <Button variant="lime" @click="openLog()">
          <Plus :size="14" aria-hidden="true" />
          记录学习
        </Button>

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

    <!-- 统计图表 -->
    <div v-if="summary.hasActivity" class="chart-grid">
      <Card class="chart-card">
        <header class="chart-head">
          <h2>学习投入</h2>
          <span>分钟 / 天</span>
        </header>
        <BaseChart v-if="summary.kpis.studyMinutes > 0" :option="studyOption" :height="220" />
        <p v-else class="chart-empty">这段时间没有学习记录</p>
      </Card>

      <Card class="chart-card">
        <header class="chart-head">
          <h2>完成任务</h2>
          <span>项 / 天</span>
        </header>
        <BaseChart v-if="summary.kpis.completedTasks > 0" :option="tasksOption" :height="220" />
        <p v-else class="chart-empty">这段时间没有完成的任务</p>
      </Card>

      <Card class="chart-card">
        <header class="chart-head">
          <h2>投递分布</h2>
          <span>当前阶段</span>
        </header>
        <BaseChart v-if="db.applications.length > 0" :option="stageOption" :height="240" />
        <p v-else class="chart-empty">还没有投递记录</p>
      </Card>
    </div>

    <Card class="ai-card">
      <header class="chart-head">
        <h2>AI 使用</h2>
        <span>{{ range }} 天</span>
      </header>

      <p v-if="aiLoading" class="chart-empty" role="status">正在读取…</p>

      <p v-else-if="aiError" class="chart-empty" role="alert">{{ aiError }}</p>

      <div v-else-if="!aiStats || aiStats.requests === 0" class="chart-empty">
        <p>这段时间还没有 AI 请求。</p>
        <Button variant="lime" size="sm" @click="goJobs">去用一次 AI 助手</Button>
      </div>

      <template v-else>
        <div class="ai-grid">
          <div class="ai-kpi">
            <span>请求</span>
            <strong>{{ aiStats.requests }}</strong>
          </div>
          <div class="ai-kpi">
            <span>Token</span>
            <strong>{{ aiStats.totalTokens.toLocaleString('zh-CN') }}</strong>
          </div>
          <div class="ai-kpi">
            <span>缓存命中</span>
            <strong>{{ Math.round(aiStats.cacheHitRate * 100) }}%</strong>
          </div>
          <div class="ai-kpi">
            <span>首字 P75</span>
            <strong>{{
              aiStats.firstTokenP75 === null ? '—' : `${aiStats.firstTokenP75} ms`
            }}</strong>
          </div>
        </div>

        <ul class="ai-models">
          <li v-for="item in aiStats.byModel" :key="item.model" class="ai-model-row">
            <span class="ai-model-name">{{ item.model }}</span>
            <span>{{ item.requests }} 次</span>
            <span>{{ item.totalTokens.toLocaleString('zh-CN') }} token</span>
            <span>P75 {{ item.firstTokenP75 === null ? '—' : `${item.firstTokenP75} ms` }}</span>
          </li>
        </ul>
      </template>
    </Card>

    <Card class="vitals-card">
      <header class="chart-head">
        <h2>Web 性能</h2>
        <span>{{ range }} 天</span>
      </header>

      <p v-if="vitalsLoading" class="chart-empty" role="status">正在读取…</p>

      <p v-else-if="vitalsError" class="chart-empty" role="alert">{{ vitalsError }}</p>

      <div v-else-if="!vitalsStats || vitalsStats.totalSamples === 0" class="chart-empty">
        <p>这段时间还没有性能样本。</p>
        <p>多访问几次页面后再回来看看。</p>
      </div>

      <template v-else>
        <div class="vitals-grid">
          <div v-for="item in vitalItems" :key="item.name" class="vital-kpi">
            <span>{{ item.label }}</span>
            <strong :class="item.rating">{{ item.text }}</strong>
            <small>
              {{ item.samples }} 个样本
              <template v-if="item.samples < 20"> · 样本较少</template>
            </small>
          </div>
        </div>

        <p class="vitals-meta">
          {{ vitalsStats.sessions }} 次采样页 · {{ vitalsStats.totalSamples }} 个指标样本
        </p>
      </template>
    </Card>

    <Card class="topic-card">
      <header class="chart-head">
        <h2>主题掌握度</h2>
        <span>薄弱优先</span>
      </header>

      <p v-if="summary.topics.length === 0" class="chart-empty">还没有标记掌握度的条目</p>

      <ul v-else class="topic-list">
        <li v-for="topic in summary.topics" :key="topic.topic" class="topic-row">
          <div class="topic-head">
            <span class="topic-name">{{ topic.topic }}</span>
            <span class="topic-count">{{ topic.total }} 条</span>
          </div>

          <div class="topic-bar" aria-hidden="true">
            <span
              :class="['topic-fill', masteryTone(topic.score)]"
              :style="{ width: `${(topic.score / 2) * 100}%` }"
            />
          </div>

          <div class="topic-meta">
            <span>生疏 {{ topic.rusty }}</span>
            <span>学习中 {{ topic.learning }}</span>
            <span>熟练 {{ topic.solid }}</span>

            <RouterLink
              class="topic-link"
              :to="{ path: '/knowledge', query: { topic: topic.topic } }"
            >
              查看 →
            </RouterLink>
          </div>
        </li>
      </ul>
    </Card>

    <!-- 学习记录弹窗 -->
    <AppDialog v-model:open="logOpen" title="记录学习" description="今天学了什么，记一笔。">
      <form id="study-log-form" class="form" @submit.prevent="saveLog">
        <div class="field-row">
          <label class="field">
            <span class="field-label">日期</span>
            <input v-model="logDraft.date" class="input" type="date" />
          </label>

          <label class="field">
            <span class="field-label">时长（分钟）</span>
            <input
              v-model.number="logDraft.minutes"
              class="input"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              @input="estimateMin = null"
            />
            <span v-if="estimateMin" class="tip">
              已带入任务估时 {{ estimateMin }} 分钟，可按实际修改
            </span>
          </label>
        </div>

        <label class="field">
          <span class="field-label">主题（必填）</span>
          <input
            v-model="logDraft.topic"
            class="input"
            type="text"
            list="study-topics"
            placeholder="Vue / 浏览器 / 算法"
          />
          <datalist id="study-topics">
            <option v-for="topic in topicOptions" :key="topic" :value="topic" />
          </datalist>
        </label>

        <label class="field">
          <span class="field-label">活动类型</span>
          <select v-model="logDraft.activity" class="input">
            <option v-for="item in ACTIVITIES" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">收获（可选）</span>
          <textarea
            v-model="logDraft.takeaway"
            class="input textarea"
            rows="3"
            placeholder="一句话记下今天真正理解的东西"
          />
        </label>
      </form>

      <template #footer>
        <Button variant="ghost" @click="logOpen = false">取消</Button>
        <Button variant="lime" type="submit" form="study-log-form" :disabled="!canSaveLog">
          记录
        </Button>
      </template>
    </AppDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { localDate } from '@/lib/date'
import { formatMinutes } from '@/lib/format'
import { rangeDates, summarize } from '@/lib/insights'
import type { InsightRange } from '@/lib/insights'
import { useDatabase } from '@/stores/db'
import type { EChartsOption } from 'echarts'
import type { JobStage, StudyLog } from '@/types'
import BaseChart from '@/components/ui/BaseChart.vue'
import { tokenColor } from '@/lib/charts'
import { Plus } from 'lucide-vue-next'
import AppDialog from '@/components/ui/AppDialog.vue'
import { createStudyLog } from '@/stores/study'
import { toast } from '@/lib/toast'
import { studyBarOption } from '@/lib/chart-options'
import { fetchChatStats, type ChatStats } from '@/lib/ai/stats'
import {
  fetchVitalsStats,
  ratingOf,
  type VitalMetricStats,
  type VitalName,
  type VitalsStats,
} from '@/lib/perf-stats'

const RANGES: { value: InsightRange; label: string }[] = [
  { value: 7, label: '最近 7 天' },
  { value: 30, label: '最近 30 天' },
]

const router = useRouter()
const route = useRoute()
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

const dayLabels = computed(() => rangeDates(today, range.value).map((date) => date.slice(5)))

const studyOption = computed(() =>
  studyBarOption(
    dayLabels.value,
    summary.value.studySeries.map((point) => point.minutes),
  ),
)

const tasksOption = computed<EChartsOption>(() => {
  const line = tokenColor('--line')
  const lineSoft = tokenColor('--line-soft')
  const muted = tokenColor('--muted')
  const faint = tokenColor('--muted-2')
  const blue = tokenColor('--blue')

  return {
    grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dayLabels.value,
      axisLine: { lineStyle: { color: line } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: lineSoft } },
      axisLabel: { color: faint, fontSize: 10 },
    },
    series: [
      {
        type: 'line',
        name: '完成任务',
        data: summary.value.completedSeries.map((point) => point.count),
        smooth: true,
        symbolSize: 5,
        lineStyle: { color: blue, width: 2 },
        itemStyle: { color: blue },
        areaStyle: { color: tokenColor('--blue-soft') },
      },
    ],
  }
})

const stageOption = computed<EChartsOption>(() => {
  const stageColors: Record<JobStage, string> = {
    saved: tokenColor('--muted-2'),
    applied: tokenColor('--blue'),
    interview: tokenColor('--amber'),
    offer: tokenColor('--lime'),
    closed: tokenColor('--stone'),
  }

  return {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: tokenColor('--muted'), fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        label: { show: false },
        itemStyle: {
          borderColor: tokenColor('--panel'),
          borderWidth: 2,
        },
        data: summary.value.stageCounts.map((item) => ({
          name: item.label,
          value: item.count,
          itemStyle: { color: stageColors[item.stage] },
        })),
      },
    ],
  }
})

function masteryTone(score: number): string {
  if (score < 0.75) return 'weak'
  if (score < 1.5) return 'mid'
  return 'strong'
}

const ACTIVITIES: { value: StudyLog['activity']; label: string }[] = [
  { value: 'reading', label: '阅读' },
  { value: 'coding', label: '写代码' },
  { value: 'practice', label: '练习' },
  { value: 'project', label: '做项目' },
]

const logOpen = ref(false)

const logDraft = reactive({
  date: today,
  minutes: 30,
  topic: '',
  activity: 'reading' as StudyLog['activity'],
  takeaway: '',
})

const topicOptions = computed(() => {
  const topics = new Set<string>()
  for (const item of db.knowledge) topics.add(item.topic)
  for (const log of db.studyLogs) topics.add(log.topic)
  return [...topics].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
})

const canSaveLog = computed(
  () => logDraft.topic.trim() !== '' && Number.isFinite(logDraft.minutes) && logDraft.minutes > 0,
)

function openLog(presetMinutes = 30) {
  Object.assign(logDraft, {
    date: today,
    minutes: presetMinutes,
    topic: '',
    activity: 'reading',
    takeaway: '',
  })
  logOpen.value = true
  estimateMin.value = null
}

function saveLog() {
  if (!canSaveLog.value) return

  const log = createStudyLog({
    date: logDraft.date,
    minutes: logDraft.minutes,
    topic: logDraft.topic,
    activity: logDraft.activity,
    takeaway: logDraft.takeaway,
  })
  if (!log) return

  logOpen.value = false
  toast.add({
    title: '已记录学习',
    description: `${log.topic} · ${log.minutes} 分钟`,
    status: 'success',
    duration: 3000,
  })
}

function readEstimateMinutes(): number | null {
  const raw = route.query.estimateMin
  if (typeof raw !== 'string' || raw.trim() === '') return null

  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return null

  return Math.min(Math.round(value), 14400)
}

const estimateMin = ref<string | null>(null)

watch(
  () => route.query.log,
  (log) => {
    if (log !== '1') return

    const preset = readEstimateMinutes()
    openLog(preset ?? 30)
    estimateMin.value = preset === null ? null : String(preset)

    router.replace({ query: { ...route.query, log: undefined, estimateMin: undefined } })
  },
  { immediate: true },
)

const aiStats = ref<ChatStats | null>(null)
const aiLoading = ref(false)
const aiError = ref<string | null>(null)
let aiRun = 0

async function loadAiStats(): Promise<void> {
  const run = ++aiRun
  aiLoading.value = true
  aiError.value = null

  try {
    const data = await fetchChatStats(range.value)
    if (run !== aiRun) return
    aiStats.value = data
  } catch (err) {
    if (run !== aiRun) return
    aiStats.value = null
    aiError.value = err instanceof Error ? err.message : 'AI 统计读取失败'
  } finally {
    if (run === aiRun) aiLoading.value = false
  }
}

watch(range, () => void loadAiStats(), { immediate: true })

function goJobs(): void {
  router.push('/jobs')
}

const vitalsStats = ref<VitalsStats | null>(null)
const vitalsLoading = ref(false)
const vitalsError = ref<string | null>(null)
let vitalsRun = 0

async function loadVitalsStats(): Promise<void> {
  const run = ++vitalsRun
  vitalsLoading.value = true
  vitalsError.value = null

  try {
    const data = await fetchVitalsStats(range.value)
    if (run !== vitalsRun) return
    vitalsStats.value = data
  } catch (err) {
    if (run !== vitalsRun) return
    vitalsStats.value = null
    vitalsError.value = err instanceof Error ? err.message : '性能统计读取失败'
  } finally {
    if (run === vitalsRun) vitalsLoading.value = false
  }
}

watch(range, () => void loadVitalsStats(), { immediate: true })

function makeVitalItem(name: VitalName, label: string, metric: VitalMetricStats) {
  const value = metric.p75

  return {
    name,
    label,
    samples: metric.samples,
    rating: value === null ? '' : ratingOf(name, value),
    text: value === null ? '—' : name === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`,
  }
}

const vitalItems = computed(() => {
  const stats = vitalsStats.value
  if (!stats) return []

  return [
    makeVitalItem('LCP', 'LCP P75', stats.metrics.LCP),
    makeVitalItem('CLS', 'CLS P75', stats.metrics.CLS),
    makeVitalItem('FCP', 'FCP P75', stats.metrics.FCP),
    makeVitalItem('FP', 'FP P75', stats.metrics.FP),
  ]
})
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

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
}

.chart-card {
  padding: var(--space-5);
}

.chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.chart-head h2 {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--color-text-strong);
}

.chart-head span {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.chart-empty {
  margin: 0;
  padding: var(--space-8) 0;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-faint);
}

.topic-card {
  padding: var(--space-5);
}

.topic-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.topic-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.topic-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.topic-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-strong);
}

.topic-count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.topic-bar {
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-background);
  overflow: hidden;
}

.topic-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 240ms ease;
}

.topic-fill.weak {
  background: var(--color-danger);
}

.topic-fill.mid {
  background: var(--color-tone-amber-fg);
}

.topic-fill.strong {
  background: var(--color-accent-strong);
}

.topic-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  font-size: var(--text-2xs);
  color: var(--color-text-muted);
}

.topic-link {
  margin-left: auto;
  color: var(--color-tone-lime-fg);
  font-weight: 600;
}

.topic-link:hover {
  text-decoration: underline;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.tip {
  margin-right: auto;
  font-size: var(--text-2xs);
  color: var(--color-tone-sage-fg);
}

/* AI 使用 */
.ai-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.ai-card .chart-head {
  margin-bottom: 0;
}

.ai-card .chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  margin: 0;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: var(--space-4);
}

.ai-kpi {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.ai-kpi span {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.06em;
  color: var(--color-text-faint);
}

.ai-kpi strong {
  font-size: var(--text-xl);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  color: var(--color-text-strong);
}

.ai-models {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}

.ai-model-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) auto auto auto;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--line-soft);
  font-size: var(--text-2xs);
  color: var(--color-text-muted);
}

.ai-model-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.ai-model-name {
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-model-row span:not(.ai-model-name) {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .ai-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ai-model-row {
    grid-template-columns: repeat(3, auto);
    justify-content: space-between;
    row-gap: var(--space-2);
  }

  .ai-model-name {
    grid-column: 1 / -1;
    overflow: visible;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

.vitals-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.vitals-card .chart-head {
  margin-bottom: 0;
}

.vitals-card .chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
}

.vital-kpi {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.vital-kpi span {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.06em;
  color: var(--color-text-faint);
}

.vital-kpi strong {
  font-size: var(--text-xl);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.vital-kpi small {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.vital-kpi .good {
  color: var(--color-tone-sage-fg);
}

.vital-kpi .needs-improvement {
  color: var(--color-tone-amber-fg);
}

.vital-kpi .poor {
  color: var(--color-tone-coral-fg);
}

.vitals-meta {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

@media (max-width: 767px) {
  .vitals-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
