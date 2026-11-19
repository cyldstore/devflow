import { reactive, ref, watch } from 'vue'
import type { Database } from '@/lib/db'
import { loadDatabase, saveDatabase, createEmptyDatabase } from '@/lib/db'
import { createSeedDatabase } from '@/lib/seed'
import { markDataChanged } from './backup'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' // 保存状态 空闲 | 保存中 | 已保存 | 保存失败

// 延迟保存时间
const SAVE_DELAY = 400

const state = reactive<Database>(loadDatabase())
const status = ref<SaveStatus>('idle')

// 计时器
let timer: ReturnType<typeof setTimeout> | undefined

// 获取数据
export function useDatabase(): Database {
  return state
}

// 保存数据
export function persist(): boolean {
  clearPending()
  const ok = saveDatabase(state)
  if (ok) markDataChanged()
  status.value = ok ? 'saved' : 'error'
  return ok
}

// 加载示例数据
export function loadSeed(): void {
  Object.assign(state, createSeedDatabase())
  persist()
}

// 清空数据
export function resetDatabase(): void {
  Object.assign(state, createEmptyDatabase())
  persist()
}

// 替换数据
export function replaceDatabase(next: Database): void {
  Object.assign(state, next)
  persist()
}

// 清除计时器
function clearPending(): void {
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
}

// 自动保存
function scheduleSave(): void {
  status.value = 'saving'
  clearPending()
  timer = setTimeout(() => {
    timer = undefined
    const ok = saveDatabase(state)
    if (ok) markDataChanged()
    status.value = ok ? 'saved' : 'error'
  }, SAVE_DELAY)
}

watch(state, scheduleSave)

window.addEventListener('beforeunload', () => {
  if (timer !== undefined) {
    clearPending()
    saveDatabase(state)
  }
})
