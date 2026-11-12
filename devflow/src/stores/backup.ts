import { computed, ref } from 'vue'
import { readJSON, writeJSON } from '@/lib/storage'

interface BackupMeta {
  lastExportedAt: string | null
  lastChangedAt: string | null
}

const META_KEY = 'backup-meta'

const stored = readJSON<BackupMeta>(META_KEY, {
  lastExportedAt: null,
  lastChangedAt: null,
})

const lastExportedAt = ref<string | null>(stored.lastExportedAt ?? null)
const lastChangedAt = ref<string | null>(stored.lastChangedAt ?? null)

function persistMeta(): void {
  writeJSON(META_KEY, {
    lastExportedAt: lastExportedAt.value,
    lastChangedAt: lastChangedAt.value,
  })
}

export function markDataChanged(): void {
  lastChangedAt.value = new Date().toISOString()
  persistMeta()
}

export function markExported(): void {
  lastExportedAt.value = new Date().toISOString()
  persistMeta()
}

export function useBackupMeta() {
  const hasUnexportedChanges = computed(() => {
    if (!lastChangedAt.value) return false
    if (!lastExportedAt.value) return true
    return lastChangedAt.value > lastExportedAt.value
  })

  const daysSinceExport = computed(() => {
    if (!lastExportedAt.value) return null
    const elapsed = Date.now() - new Date(lastExportedAt.value).getTime()
    return Math.floor(elapsed / 86_400_000)
  })

  return { lastExportedAt, lastChangedAt, hasUnexportedChanges, daysSinceExport }
}
