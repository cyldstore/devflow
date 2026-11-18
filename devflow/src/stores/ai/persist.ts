import type { PiniaPluginContext } from 'pinia'
import type { InterviewSession } from '@/types'
import type { useAiSessionStore } from './session'

const STORAGE_KEY = 'devflow:ai-session'
const VERSION = 1

interface PersistedAiSession {
  version: number
  sessions: Record<string, InterviewSession>
  activeApplicationId: string | null
}

export function persistAiSession({ store }: PiniaPluginContext): void {
  if (store.$id !== 'aiSession') return

  const aiStore = store as unknown as ReturnType<typeof useAiSessionStore>
  const raw = localStorage.getItem(STORAGE_KEY)

  if (raw) {
    try {
      const saved = JSON.parse(raw) as PersistedAiSession
      if (saved.version === VERSION) {
        aiStore.$patch({
          sessions: saved.sessions,
          activeApplicationId: saved.activeApplicationId,
        })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  store.$subscribe(
    (_mutation, state) => {
      const payload: PersistedAiSession = {
        version: VERSION,
        sessions: state.sessions,
        activeApplicationId: state.activeApplicationId,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    { detached: true },
  )
}
