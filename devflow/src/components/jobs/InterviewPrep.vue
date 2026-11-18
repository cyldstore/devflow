<template>
  <section class="prep-card">
    <header class="prep-head">
      <div>
        <h3 class="prep-title">面试准备</h3>
        <p class="prep-subtitle">简历和岗位要求会用于 AI 分析与模拟面试。</p>
      </div>
      <Button variant="lime" size="sm" @click="emit('openAi')"> 打开 AI 助手 </Button>
    </header>

    <div class="prep-grid">
      <div class="prep-row">
        <label class="prep-label" for="prep-resume">简历</label>
        <span class="prep-value">
          <select
            id="prep-resume"
            class="input"
            :value="application.resumeId ?? ''"
            @change="onResumeChange"
          >
            <option value="">未选择简历</option>
            <option v-for="resume in db.resumes" :key="resume.id" :value="resume.id">
              {{ resume.title }}
            </option>
          </select>
          <span v-if="selectedResume" class="prep-meta">
            {{ selectedResume.fileType?.toUpperCase() ?? '简历' }} ·
            {{ selectedResume.updatedAt.slice(0, 10) }} 更新
          </span>
          <button type="button" class="prep-link" @click="emit('manageResumes')">管理简历库</button>
        </span>
      </div>

      <div class="prep-row">
        <label class="prep-label" for="prep-job-requirements">岗位要求</label>
        <span class="prep-value">
          <textarea
            v-model="jobRequirementsDraft"
            class="input textarea"
            rows="3"
            placeholder="粘贴岗位要求/职位描述，模拟面试会使用"
            @blur="saveJobRequirements"
            id="prep-job-requirements"
          />
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Application } from '@/types'
import Button from '@/components/ui/Button.vue'
import { useDatabase } from '@/stores/db'
import { setApplicationResume } from '@/stores/resumes'
import { updateApplication } from '@/stores/applications'

const props = defineProps<{
  application: Application
}>()

const emit = defineEmits<{
  openAi: []
  manageResumes: []
}>()

const db = useDatabase()

const selectedResume = computed(() => {
  const id = props.application.resumeId
  return id ? (db.resumes.find((resume) => resume.id === id) ?? null) : null
})

const jobRequirementsDraft = ref('')

watch(
  () => props.application.id,
  () => {
    jobRequirementsDraft.value = props.application.jobRequirements ?? ''
  },
  { immediate: true },
)

function onResumeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  setApplicationResume(props.application.id, value || undefined)
}

function saveJobRequirements(): void {
  updateApplication(props.application.id, {
    jobRequirements: jobRequirementsDraft.value,
  })
}
</script>

<style scoped>
.prep-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-background);
}

.prep-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.prep-title {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-strong);
}

.prep-subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-2xs);
}

.prep-grid {
  display: grid;
  gap: var(--space-3);
}

.prep-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
}

.prep-label {
  padding-top: 8px;
  color: var(--color-text-muted);
  font-size: var(--text-2xs);
}

.prep-value {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.prep-meta {
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
}

.prep-link {
  justify-self: start;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-2xs);
  text-decoration: underline;
  cursor: pointer;
}

.prep-link:hover {
  color: var(--color-text-strong);
}

@media (max-width: 767px) {
  .prep-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .prep-label {
    padding-top: 0;
  }
}
</style>
