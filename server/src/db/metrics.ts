import { db } from "./index.js";

export interface ChatMetricInput {
  route: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  firstTokenMs: number | null;
  totalMs: number;
  cached?: boolean;
}

interface MetricRow {
  model: string | null;
  cached: number;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  first_token_ms: number | null;
  total_ms: number | null;
}

export interface ChatStatsByModel {
  model: string;
  requests: number;
  totalTokens: number;
  firstTokenP75: number | null;
}

export interface ChatStats {
  days: number;
  requests: number;
  cachedRequests: number;
  cacheHitRate: number; // 0..1
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  firstTokenP75: number | null;
  avgTotalMs: number | null; // 只算非缓存
  byModel: ChatStatsByModel[];
}

const insert = db.prepare(`
  INSERT INTO metrics
    (route, model, prompt_tokens, completion_tokens, first_token_ms, total_ms, cached)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const selectRows = db.prepare(`
  SELECT model, cached, prompt_tokens, completion_tokens, first_token_ms, total_ms
  FROM metrics
  WHERE route = '/api/ai/chat'
    AND created_at >= datetime('now', ?)
`);

export function recordChatMetric(input: ChatMetricInput): void {
  insert.run(
    input.route,
    input.model,
    input.promptTokens,
    input.completionTokens,
    input.firstTokenMs,
    input.totalMs,
    input.cached ? 1 : 0,
  );
}

export function getChatStats(days: number): ChatStats {
  const rows = selectRows.all(`-${days} days`) as MetricRow[];

  const totals = rows.reduce(
    (acc, row) => {
      acc.prompt += row.prompt_tokens ?? 0;
      acc.completion += row.completion_tokens ?? 0;
      return acc;
    },
    { prompt: 0, completion: 0 },
  );

  const cachedRequests = rows.filter((row) => row.cached === 1).length;
  const firstTokens = rows
    .filter((row) => row.cached === 0 && row.first_token_ms !== null)
    .map((row) => row.first_token_ms as number)
    .sort((a, b) => a - b);
  const totalMs = rows
    .filter((row) => row.cached === 0 && row.total_ms !== null)
    .map((row) => row.total_ms as number);

  const groups = new Map<
    string,
    { requests: number; totalTokens: number; firstTokens: number[] }
  >();

  for (const row of rows) {
    const model = row.model ?? "unknown";
    const group = groups.get(model) ?? {
      requests: 0,
      totalTokens: 0,
      firstTokens: [],
    };
    group.requests += 1;
    group.totalTokens +=
      (row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0);
    if (row.cached === 0 && row.first_token_ms !== null) {
      group.firstTokens.push(row.first_token_ms);
    }
    groups.set(model, group);
  }

  return {
    days,
    requests: rows.length,
    cachedRequests,
    cacheHitRate: rows.length === 0 ? 0 : cachedRequests / rows.length,
    promptTokens: totals.prompt,
    completionTokens: totals.completion,
    totalTokens: totals.prompt + totals.completion,
    firstTokenP75: percentile(firstTokens, 0.75),
    avgTotalMs:
      totalMs.length === 0
        ? null
        : Math.round(
            totalMs.reduce((sum, value) => sum + value, 0) / totalMs.length,
          ),
    byModel: [...groups.entries()]
      .map(([model, group]) => ({
        model,
        requests: group.requests,
        totalTokens: group.totalTokens,
        firstTokenP75: percentile(
          [...group.firstTokens].sort((a, b) => a - b),
          0.75,
        ),
      }))
      .sort((a, b) => b.requests - a.requests),
  };
}

// nearest-rank：0.75 × n 向上取整，再减 1
function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.min(index, sorted.length - 1)];
}
