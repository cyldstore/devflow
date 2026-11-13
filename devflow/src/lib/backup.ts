import type { Database } from './db'
import { normalizeDatabase } from './db'
import { localDate } from './date'

const APP_ID = 'devflow'
const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof APP_ID
  version: number
  exportedAt: string
  data: Database
}

export type ImportResult =
  { ok: true; data: Database; exportedAt: string | null } | { ok: false; error: string }

// 生成备份
export function createBackup(db: Database): string {
  const payload: BackupFile = {
    app: APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: db,
  }
  return JSON.stringify(payload, null, 2)
}

// 下载备份
export function downloadBackup(db: Database): void {
  const blob = new Blob([createBackup(db)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `devflow-backup-${localDate()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function parseBackup(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: '文件不是合法的 JSON' }
  }

  if (!isRecord(raw) || raw.app !== APP_ID || !isRecord(raw.data)) {
    return { ok: false, error: '这不是 DevFlow 的备份文件' }
  }

  return {
    ok: true,
    data: normalizeDatabase(raw.data),
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : null,
  }
}

export async function readBackupFile(file: File): Promise<ImportResult> {
  try {
    return parseBackup(await file.text())
  } catch {
    return { ok: false, error: '无法读取文件' }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
