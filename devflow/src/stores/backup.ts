import { computed, ref } from 'vue'
import { readJSON, writeJSON } from '@/lib/storage'

interface BackupMeta {
  lastExportedAt: string | null // 上次导出时间
  lastChangedAt: string | null //  上次数据变更时间
  reminderEnabled: boolean
  snoozedUntil: string | null // 稍后提醒时间
}

const META_KEY = 'backup-meta' // localStorage键值

const stored = readJSON<BackupMeta>(META_KEY, {
  lastExportedAt: null,
  lastChangedAt: null,
  reminderEnabled: true,
  snoozedUntil: null,
})

const lastExportedAt = ref<string | null>(stored.lastExportedAt ?? null)
const lastChangedAt = ref<string | null>(stored.lastChangedAt ?? null)

function persistMeta(): void {
  writeJSON(META_KEY, {
    lastExportedAt: lastExportedAt.value,
    lastChangedAt: lastChangedAt.value,
    reminderEnabled: reminderEnabled.value,
    snoozedUntil: snoozedUntil.value,
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

  const isSnoozed = computed(() => {
    if (!snoozedUntil.value) return false
    return new Date(snoozedUntil.value).getTime() > Date.now()
  })

  return {
    lastExportedAt,
    lastChangedAt,
    hasUnexportedChanges,
    daysSinceExport,
    reminderEnabled,
    isSnoozed,
  }
}

const reminderEnabled = ref(stored.reminderEnabled ?? true)
const snoozedUntil = ref<string | null>(stored.snoozedUntil ?? null)

export function setReminderEnabled(value: boolean): void {
  reminderEnabled.value = value
  persistMeta()
}

export function snoozeReminder(days = 3): void {
  const until = new Date()
  until.setDate(until.getDate() + days)
  snoozedUntil.value = until.toISOString()
  persistMeta()
}
