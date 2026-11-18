<template>
  <section v-if="app" class="ai-workspace">
    <div class="workspace-tabs" role="tablist" aria-label="AI 助手视图">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'match'"
        :class="['workspace-tab', { active: tab === 'match' }]"
        @click="tab = 'match'"
      >
        匹配分析
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'interview'"
        :class="['workspace-tab', { active: tab === 'interview' }]"
        @click="tab = 'interview'"
      >
        模拟面试
      </button>
    </div>

    <AiMatchPanel v-show="tab === 'match'" :application="app" :resume="resume" />

    <InterviewPanel v-if="tab === 'interview'" :application-id="app.id" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDatabase } from '@/stores/db'
import AiMatchPanel from '@/components/ai/AiMatchPanel.vue'
import InterviewPanel from '@/components/ai/InterviewPanel.vue'

const props = defineProps<{
  applicationId: string
}>()

const db = useDatabase()

const app = computed(() => db.applications.find((item) => item.id === props.applicationId) ?? null)

const resume = computed(() =>
  app.value?.resumeId ? (db.resumes.find((item) => item.id === app.value?.resumeId) ?? null) : null,
)

const tab = ref<'match' | 'interview'>('match')
</script>

<style scoped>
.ai-workspace {
  display: grid;
  gap: var(--space-4);
}

.workspace-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.workspace-tab {
  height: 30px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.workspace-tab.active {
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-weight: 600;
  box-shadow: var(--shadow-card);
}

.workspace-tab:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}
</style>
