import { createHash } from "node:crypto";
import type { ChatRequest } from "./types.js";

const CACHE_VERSION = 1;

export function buildCacheKey(request: ChatRequest): string {
  const payload = {
    v: CACHE_VERSION,
    model: request.model,
    messages: request.messages,
    temperature: request.temperature ?? null,
    maxTokens: request.maxTokens ?? null,
    responseFormat: request.responseFormat ?? "text",
  };
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex");
}