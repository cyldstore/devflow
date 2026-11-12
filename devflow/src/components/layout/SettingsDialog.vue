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

      <label class="toggle-row">
        <input v-model="draft.reminderEnabled" type="checkbox" class="toggle-input" />
        <span class="toggle-copy">
          <span class="toggle-title">备份提醒</span>
          <span class="toggle-desc"> 超过 7 天没有导出时，在概览页提示。数据只存在本机。 </span>
          <span class="toggle-desc">
            上次导出：{{ lastExportedAt ? lastExportedAt.slice(0, 10) : '还没有导出过' }}
          </span>
        </span>
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
import { setReminderEnabled, useBackupMeta } from '@/stores/backup'

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
  reminderEnabled: true,
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

  setReminderEnabled(draft.reminderEnabled)
  open.value = false
  toast.add({ title: '设置已保存', status: 'success', duration: 3000 })
}

const { reminderEnabled, lastExportedAt } = useBackupMeta()
watch(settingsOpen, (isOpen) => {
  if (!isOpen) return
  draft.name = db.profile.name
  draft.targetRole = db.profile.targetRole
  draft.weeklyGoalHours = db.profile.weeklyGoalHours
  draft.reminderEnabled = reminderEnabled.value
})
</script>

<style scoped>
.field-tip {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}
.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  cursor: pointer;
}

.toggle-input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent-strong);
}

.toggle-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-strong);
}

.toggle-desc {
  font-size: var(--text-2xs);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}
</style>
