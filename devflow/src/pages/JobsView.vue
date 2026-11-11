<template>
  <section class="jobs">
    <header class="page-head">
      <div>
        <p class="eyebrow">JOBS</p>
        <h1>求职</h1>
      </div>
      <p class="summary">
        {{ activeCount }} 个进行中
        <template v-if="overdueCount > 0"> · {{ overdueCount }} 个待跟进</template>
      </p>
    </header>

    <div class="board">
      <section v-for="column in columns" :key="column.stage" class="column">
        <header class="column-head">
          <span class="column-title">
            <span class="stage-dot" :class="column.stage" aria-hidden="true" />
            {{ column.label }}
          </span>
          <span class="column-count">{{ column.applications.length }}</span>
        </header>

        <div class="column-body">
          <article
            v-for="app in column.applications"
            :key="app.id"
            :class="['job-card', { overdue: isFollowUpOverdue(app, today) }]"
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
          </article>

          <p v-if="column.applications.length === 0" class="column-empty">暂无</p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import { groupApplications, isFollowUpOverdue } from '@/lib/jobs'
import { localDate } from '@/lib/date'
import { useDatabase } from '@/stores/db'

const db = useDatabase()
const today = localDate()

const columns = computed(() => groupApplications(db.applications))
const activeCount = computed(() => db.applications.filter((app) => app.stage !== 'closed').length)
const overdueCount = computed(
  () => db.applications.filter((app) => isFollowUpOverdue(app, today)).length,
)
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

.summary {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  align-items: start;
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
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition: border-color 140ms ease;
}

.job-card.overdue {
  border-color: var(--color-danger);
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
</style>
