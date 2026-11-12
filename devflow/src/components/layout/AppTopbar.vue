<template>
  <header class="topbar">
    <RouterLink class="brand" to="/" aria-label="DevFlow 首页">
      <span class="brand-mark">D</span>
      <span class="brand-name">DevFlow</span>
    </RouterLink>

    <div class="actions">
      <Button
        variant="ghost"
        class="export-btn"
        :aria-label="hasUnexportedChanges ? '导出备份（有未备份的修改）' : '导出备份'"
        @click="exportData"
      >
        导出
        <span v-if="hasUnexportedChanges" class="backup-dot" aria-hidden="true" />
      </Button>

      <Button variant="ghost" @click="openSettings">设置</Button>
    </div>
  </header>
</template>
<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import { openSettings } from '@/stores/ui'
import { useDatabase } from '@/stores/db'
import { markExported, useBackupMeta } from '@/stores/backup'
import { downloadBackup } from '@/lib/backup'
import { toast } from '@/lib/toast'

const db = useDatabase()
const { hasUnexportedChanges } = useBackupMeta()

function exportData() {
  downloadBackup(db)
  markExported()
  toast.add({
    title: '已导出备份',
    description: '文件已保存到下载目录',
    status: 'success',
    duration: 3000,
  })
}
</script>

<style scoped>
.topbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: 64px;
  padding: 0 var(--gutter-page);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: none;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 800;
}

.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: none;
}

@media (max-width: 767px) {
  .topbar {
    gap: var(--space-3);
    padding: 0 var(--space-5);
  }

  .brand-name {
    display: none;
  }

  .actions {
    gap: var(--space-2);
  }
}

.brand:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.export-btn {
  position: relative;
}

.backup-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  background: var(--color-danger);
}
</style>
