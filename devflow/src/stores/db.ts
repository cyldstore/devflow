import { reactive, readonly, ref, watch } from 'vue'
import type { Database } from '@/lib/db'
import { loadDatabase, saveDatabase } from '@/lib/db'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'  // 保存状态

const SAVE_DELAY = 400

const state = reactive<Database>(loadDatabase())
const status = ref<SaveStatus>('idle')

let timer: ReturnType<typeof setTimeout> | undefined

export function useDatabase(): Database {
  return state
}

export function useSaveStatus() {
  return readonly(status)
}

export function persist(): boolean {
  clearPending()
  const ok = saveDatabase(state)
  status.value = ok ? 'saved' : 'error'
  return ok
}

function clearPending(): void {
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
}

function scheduleSave(): void {
  status.value = 'saving'
  clearPending()
  timer = setTimeout(() => {
    timer = undefined
    const ok = saveDatabase(state)
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
