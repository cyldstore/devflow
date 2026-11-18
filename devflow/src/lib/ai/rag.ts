export type RagDocType = 'resume' | 'knowledge'

export interface IndexDocumentInput {
  docType: RagDocType
  docId: string
  title: string
  content: string
  sourceUpdatedAt?: string
}

export interface IndexDocumentResult {
  ok: true
  docType: RagDocType
  docId: string
  chunks: number
  dimensions: number
  provider: string
}

export async function indexDocument(input: IndexDocumentInput): Promise<IndexDocumentResult> {
  const response = await fetch('/api/rag/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = (await response.json().catch(() => null)) as
    (IndexDocumentResult & { error?: string }) | null

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? `索引失败（${response.status}）`)
  }

  return data
}

export interface RagSearchResult {
  docType: RagDocType
  docId: string
  chunkIndex: number
  title: string
  content: string
  score: number
}

export interface SearchDocumentsInput {
  query: string
  docType?: RagDocType
  docId?: string
  topK?: number
}

export interface SearchDocumentsResult {
  ok: true
  query: string
  provider: string | null
  results: RagSearchResult[]
}

export async function searchDocuments(input: SearchDocumentsInput): Promise<SearchDocumentsResult> {
  const response = await fetch('/api/rag/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = (await response.json().catch(() => null)) as
    (SearchDocumentsResult & { error?: string }) | null

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? `检索失败（${response.status}）`)
  }

  return data
}

export interface IndexStatusInput {
  docType: RagDocType
  docId: string
}

export interface IndexStatusResult {
  ok: true
  indexed: boolean
  chunks: number
  sourceUpdatedAt: string | null
}

export async function getIndexStatus(input: IndexStatusInput): Promise<IndexStatusResult> {
  const params = new URLSearchParams({
    docType: input.docType,
    docId: input.docId,
  })

  const response = await fetch(`/api/rag/status?${params.toString()}`)

  const data = (await response.json().catch(() => null)) as
    (IndexStatusResult & { error?: string }) | null

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? `索引状态查询失败（${response.status}）`)
  }

  return data
}
