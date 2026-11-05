import { reactive } from 'vue'
import type { Database } from '@/lib/db'
import { loadDatabase, saveDatabase } from '@/lib/db'

const state = reactive<Database>(loadDatabase())

export function useDatabase(): Database {
  return state
}

export function persist(): boolean {
  return saveDatabase(state)
}
