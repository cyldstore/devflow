export const EMBEDDING_DIM = 384;

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens: string[] = [];

  // 提取中文连续片段
  const chineseRuns = normalized.match(/[\u4e00-\u9fff]+/g) ?? [];

  for (const run of chineseRuns) {
    if (run.length === 1) {
      tokens.push(run);
      continue;
    }

    // 中文双字切片
    for (let i = 0; i < run.length - 1; i++) {
      tokens.push(run.slice(i, i + 2));
    }
  }

  // 提取英文/数字单词
  const words = normalized.match(/[a-z0-9]+/g) ?? [];
  tokens.push(...words);

  return tokens;
}

// FNV-1a 哈希算法
function hashToken(token: string): number {
  let hash = 2166136261;

  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function embedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);

  for (const token of tokenize(text)) {
    const hash = hashToken(token);
    // 把哈希值映射到 0 到 384 之间作为索引
    const index = hash % EMBEDDING_DIM;
    const sign = hash & 0x80000000 ? -1 : 1;
    vector[index] += sign;
  }

  // 计算向量的模长
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) {
    return vector;
  }

  return vector.map((value) => value / norm);
}

// 计算两个向量之间的夹角余弦值
export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly name = "hash";
  readonly dimensions = EMBEDDING_DIM;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => embedText(text));
  }
}

export const hashEmbedding = new HashEmbeddingProvider();
