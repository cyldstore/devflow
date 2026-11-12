<template>
  <AppDialog v-model:open="open" title="设置" description="这些信息只保存在这台电脑上。">
    <form id="settings-form" class="form" @submit.prevent="save">
      <label class="field">
        <span class="field-label">称呼</span>
        <input v-model="draft.name" class="input" type="text" placeholder="怎么称呼你" />
      </label>

      <label class="field">
        <span class="field-label">目标岗位</span>
        <input v-model="draft.targetRole" class="input" type="text" placeholder="前端开发" />
      </label>

      <label class="field">
        <span class="field-label">每周学习目标（小时）</span>
        <input
          v-model.number="draft.weeklyGoalHours"
          class="input"
          type="number"
          min="1"
          max="80"
          step="1"
        />
        <span class="field-tip">概览页的"本周学习"按这个目标计算完成度。</span>
      </label>
    </form>

    <template #footer>
      <Button variant="ghost" @click="open = false">取消</Button>
      <Button variant="lime" type="submit" form="settings-form" :disabled="!canSave"> 保存 </Button>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import Button from '@/components/ui/Button.vue'
import { updateProfile } from '@/stores/profile'
import { settingsOpen } from '@/stores/ui'
import { useDatabase } from '@/stores/db'
import { toast } from '@/lib/toast'

const db = useDatabase()

const open = computed({
  get: () => settingsOpen.value,
  set: (value) => {
    settingsOpen.value = value
  },
})

const draft = reactive({
  name: '',
  targetRole: '',
  weeklyGoalHours: 10,
})

watch(settingsOpen, (isOpen) => {
  if (!isOpen) return

  draft.name = db.profile.name
  draft.targetRole = db.profile.targetRole
  draft.weeklyGoalHours = db.profile.weeklyGoalHours
})

const canSave = computed(
  () =>
    Number.isFinite(draft.weeklyGoalHours) &&
    draft.weeklyGoalHours >= 1 &&
    draft.weeklyGoalHours <= 80,
)

function save() {
  if (!canSave.value) return

  updateProfile({
    name: draft.name.trim(),
    targetRole: draft.targetRole.trim(),
    weeklyGoalHours: Math.round(draft.weeklyGoalHours),
  })

  open.value = false
  toast.add({ title: '设置已保存', status: 'success', duration: 3000 })
}
</script>

<style scoped>
.field-tip {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}
</style>
