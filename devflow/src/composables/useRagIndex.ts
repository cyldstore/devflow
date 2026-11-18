import { ref, watch } from 'vue'
import { getIndexStatus, indexDocument, type RagDocType } from '@/lib/ai/rag'

export interface RagIndexSource {
  docType: RagDocType
  docId: string
  title: string
  content: string
  version: string
}

export type RagIndexState = 'idle' | 'checking' | 'indexing' | 'ready' | 'error' | 'empty'

export function useRagIndex(getSource: () => RagIndexSource | null) {
  const state = ref<RagIndexState>('idle')
  const error = ref<string | null>(null)

  let run = 0

  async function ensureIndex(): Promise<void> {
    const source = getSource()

    if (!source || !source.content.trim()) {
      state.value = 'empty'
      return
    }

    const currentRun = ++run
    state.value = 'checking'
    error.value = null

    try {
      const status = await getIndexStatus({
        docType: source.docType,
        docId: source.docId,
      })

      if (currentRun !== run) return

      if (status.indexed && status.sourceUpdatedAt === source.version) {
        state.value = 'ready'
        return
      }

      state.value = 'indexing'

      await indexDocument({
        docType: source.docType,
        docId: source.docId,
        title: source.title,
        content: source.content,
        sourceUpdatedAt: source.version,
      })

      if (currentRun !== run) return
      state.value = 'ready'
    } catch (err) {
      if (currentRun !== run) return
      error.value = err instanceof Error ? err.message : '索引失败'
      state.value = 'error'
    }
  }

  watch(
    () => {
      const source = getSource()
      return source ? `${source.docType}:${source.docId}:${source.version}` : null
    },
    () => {
      void ensureIndex()
    },
    { immediate: true },
  )

  return { state, error, ensureIndex }
}
