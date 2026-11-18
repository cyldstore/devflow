import { db } from "./index.js";
import type { FinishReason, TokenUsage } from "../llm/types.js";

export interface CachedChatResult {
  text: string;
  usage: TokenUsage | null;
  finishReason: FinishReason;
}

const select = db.prepare(`
  SELECT value FROM cache
  WHERE cache_key = ?
    AND (expires_at IS NULL OR expires_at > datetime('now'))
`);

const upsert = db.prepare(`
  INSERT INTO cache (cache_key, value, expires_at)
  VALUES (?, ?, datetime('now', '+7 days'))
  ON CONFLICT(cache_key) DO UPDATE SET
    value = excluded.value,
    created_at = datetime('now'),
    expires_at = excluded.expires_at
`);

const remove = db.prepare("DELETE FROM cache WHERE cache_key = ?");

export function getCachedChat(key: string): CachedChatResult | null {
  const row = select.get(key) as { value: string } | undefined;
  if (!row) return null;

  try {
    return JSON.parse(row.value) as CachedChatResult;
  } catch {
    remove.run(key);
    return null;
  }
}

export function setCachedChat(key: string, result: CachedChatResult): void {
  upsert.run(key, JSON.stringify(result));
}
