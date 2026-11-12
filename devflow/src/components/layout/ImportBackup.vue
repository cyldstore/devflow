<template>
  <Button variant="ghost" @click="pickFile">导入</Button>

  <input
    ref="fileInput"
    type="file"
    class="file-input"
    accept=".json,application/json"
    @change="onFileChange"
  />

  <AppDialog
    v-model:open="confirmOpen"
    title="导入备份"
    description="导入会覆盖这台设备上的全部数据。"
  >
    <div v-if="pending" class="import-summary">
      <p class="import-time">备份导出时间：{{ exportLabel }}</p>

      <div class="counts">
        <div class="count-col">
          <span class="count-title">备份内容</span>
          <span v-for="item in pendingCounts" :key="item.label">
            {{ item.label }} {{ item.value }}
          </span>
        </div>

        <div class="count-col">
          <span class="count-title">当前内容</span>
          <span v-for="item in currentCounts" :key="item.label">
            {{ item.label }} {{ item.value }}
          </span>
        </div>
      </div>

      <p class="import-warn">当前数据会被替换。建议先导出当前数据，导入后 10 秒内也可以撤销。</p>
    </div>

    <template #footer>
      <Button variant="ghost" @click="exportCurrent">先导出当前</Button>
      <Button variant="ghost" @click="confirmOpen = false">取消</Button>
      <Button variant="danger" @click="confirmImport">覆盖导入</Button>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import Button from '@/components/ui/Button.vue'
import { readBackupFile } from '@/lib/backup'
import type { Database } from '@/lib/db'
import { toast } from '@/lib/toast'
import { replaceDatabase, useDatabase } from '@/stores/db'
import { useBackupExport } from '@/composables/useBackupExport'

const db = useDatabase()
const { exportData } = useBackupExport()

const fileInput = ref<HTMLInputElement | null>(null)
const confirmOpen = ref(false)
const pending = ref<Database | null>(null)
const pendingExportedAt = ref<string | null>(null)

function countsOf(data: Database) {
  return [
    { label: '任务', value: data.tasks.length },
    { label: '知识', value: data.knowledge.length },
    { label: '投递', value: data.applications.length },
    { label: '学习', value: data.studyLogs.length },
  ]
}

const pendingCounts = computed(() => (pending.value ? countsOf(pending.value) : []))
const currentCounts = computed(() => countsOf(db))

const exportLabel = computed(() => {
  if (!pendingExportedAt.value) return '未知'
  return pendingExportedAt.value.slice(0, 16).replace('T', ' ')
})

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  // 允许再次选择同一个文件
  input.value = ''
  if (!file) return

  const result = await readBackupFile(file)

  if (!result.ok) {
    toast.add({
      title: '导入失败',
      description: result.error,
      status: 'error',
      duration: 4000,
    })
    return
  }

  pending.value = result.data
  pendingExportedAt.value = result.exportedAt
  confirmOpen.value = true
}

function exportCurrent() {
  exportData()
}

function confirmImport() {
  if (!pending.value) return

  const snapshot = JSON.parse(JSON.stringify(db)) as Database
  const next = pending.value

  replaceDatabase(next)

  confirmOpen.value = false
  pending.value = null

  toast.add({
    title: '已导入备份',
    description: '当前数据已被替换',
    status: 'success',
    duration: 10000,
    actionProps: {
      label: '撤销',
      altText: '撤销导入并恢复导入前的数据',
      onClick: () => replaceDatabase(snapshot),
    },
  })
}
</script>

<style scoped>
.file-input {
  display: none;
}

.import-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.import-time {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.counts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.count-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.count-title {
  margin-bottom: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.import-warn {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--color-danger);
}
</style>
