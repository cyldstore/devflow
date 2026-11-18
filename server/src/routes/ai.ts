import { Router } from "express";
import type { Request, Response } from "express";
import { provider } from "../llm/index.js";
import { LLMError, type TokenUsage } from "../llm/types.js";
import type {
  ChatMessage,
  ChatRequest,
  ChatRole,
  StreamChunk,
  ResponseFormat,
  FinishReason,
} from "../llm/types.js";
import { recordChatMetric } from "../db/metrics.js";
import {
  type ChatPurpose,
  isChatPurpose,
  resolveModel,
} from "../llm/routing.js";
import { buildCacheKey } from "../llm/cache-key.js";
import { getCachedChat, setCachedChat } from "../db/cache.js";

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 20_000;

export const aiRouter = Router();

aiRouter.post("/chat", async (req: Request, res: Response) => {
  const parsed = parseChatRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { model, purpose, ...rest } = parsed.value;
  const request: ChatRequest = {
    ...rest,
    model: model ?? resolveModel(provider, purpose),
  };

  await streamChatResponse(res, request);
});

type ChatRequestInput = Omit<ChatRequest, "model"> & {
  model?: string;
  purpose?: ChatPurpose;
};
type ParseResult =
  | { ok: true; value: ChatRequestInput }
  | { ok: false; error: string };

// 解析请求体
function parseChatRequest(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "请求体必须是 JSON 对象" };
  }

  const data = body as Record<string, unknown>;
  const rawMessages = data.messages;

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { ok: false, error: "messages 必须是非空数组" };
  }

  if (rawMessages.length > MAX_MESSAGES) {
    return { ok: false, error: `messages 不能超过 ${MAX_MESSAGES} 条` };
  }

  const messages: ChatMessage[] = [];

  for (const item of rawMessages) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "每条 message 必须是对象" };
    }

    const message = item as Record<string, unknown>;
    const role = message.role;
    const content = message.content;

    if (!isChatRole(role)) {
      return { ok: false, error: "message.role 只能是 system/user/assistant" };
    }

    if (typeof content !== "string" || content.length === 0) {
      return { ok: false, error: "message.content 必须是非空字符串" };
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return {
        ok: false,
        error: `message.content 不能超过 ${MAX_CONTENT_LENGTH} 字符`,
      };
    }

    messages.push({ role, content });
  }

  let model: string | undefined;
  const rawModel = data.model;
  if (rawModel !== undefined) {
    if (typeof rawModel !== "string" || rawModel.trim().length === 0) {
      return { ok: false, error: "model 必须是非空字符串" };
    }
    model = rawModel.trim();
  }

  let purpose: ChatPurpose | undefined;
  const rawPurpose = data.purpose;
  if (rawPurpose !== undefined) {
    if (!isChatPurpose(rawPurpose)) {
      return {
        ok: false,
        error: "purpose 只能是 analysis/interview/summary/qa",
      };
    }
    purpose = rawPurpose;
  }

  let temperature: number | undefined;
  const rawTemperature = data.temperature;

  if (rawTemperature !== undefined) {
    if (
      typeof rawTemperature !== "number" ||
      !Number.isFinite(rawTemperature) ||
      rawTemperature < 0 ||
      rawTemperature > 2
    ) {
      return { ok: false, error: "temperature 必须是 0 到 2 之间的数字" };
    }
    temperature = rawTemperature;
  }

  let maxTokens: number | undefined;
  const rawMaxTokens = data.maxTokens;

  if (rawMaxTokens !== undefined) {
    if (
      typeof rawMaxTokens !== "number" ||
      !Number.isInteger(rawMaxTokens) ||
      rawMaxTokens <= 0
    ) {
      return { ok: false, error: "maxTokens 必须是正整数" };
    }
    maxTokens = rawMaxTokens;
  }

  let responseFormat: ResponseFormat = "text";
  const rawResponseFormat = data.responseFormat;

  if (rawResponseFormat !== undefined) {
    if (!isResponseFormat(rawResponseFormat)) {
      return { ok: false, error: "responseFormat 只能是 text 或 json" };
    }
    responseFormat = rawResponseFormat;
  }

  return {
    ok: true,
    value: { model, purpose, messages, temperature, maxTokens, responseFormat },
  };
}

function isChatRole(value: unknown): value is ChatRole {
  return value === "system" || value === "user" || value === "assistant";
}

// 请求流响应
async function streamChatResponse(
  res: Response,
  request: ChatRequest,
): Promise<void> {
  const controller = new AbortController();

  res.on("close", () => {
    controller.abort();
  });

  if (res.destroyed) {
    controller.abort();
    return;
  }

  function recordMetric(options: {
    cached: boolean;
    firstTokenMs: number | null;
    totalMs: number;
    usage: TokenUsage | null;
  }): void {
    try {
      recordChatMetric({
        route: "/api/ai/chat",
        model: request.model,
        promptTokens: options.usage?.promptTokens ?? null,
        completionTokens: options.usage?.completionTokens ?? null,
        firstTokenMs: options.firstTokenMs,
        totalMs: options.totalMs,
        cached: options.cached,
      });
    } catch (error) {
      console.error("[metrics] write failed", error);
    }
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const startedAt = performance.now();
    let firstTokenMs: number | null = null;
    let usage: TokenUsage | null = null;
    let sawDone = false;

    const cacheKey = buildCacheKey(request);
    const cached = getCachedChat(cacheKey);

    if (cached) {
      const replayStartedAt = performance.now();

      writeChunk(res, { type: "delta", text: cached.text });
      if (cached.usage) {
        writeChunk(res, { type: "usage", usage: cached.usage });
      }
      writeChunk(res, { type: "done", finishReason: cached.finishReason });

      recordMetric({
        cached: true,
        firstTokenMs: 0,
        totalMs: Math.round(performance.now() - replayStartedAt),
        usage: cached.usage,
      });
      return;
    }

    let fullText = "";
    let finishReason: FinishReason = "unknown";

    for await (const chunk of provider.streamChat({
      ...request,
      signal: controller.signal,
    })) {
      if (res.destroyed || res.writableEnded) break;

      if (chunk.type === "delta") {
        fullText += chunk.text;
        if (firstTokenMs === null) {
          firstTokenMs = Math.round(performance.now() - startedAt);
        }
      }
      if (chunk.type === "usage") usage = chunk.usage;
      if (chunk.type === "done") {
        sawDone = true;
        finishReason = chunk.finishReason;
      }

      writeChunk(res, chunk);
    }
    if (sawDone) {
      recordMetric({
        cached: false,
        firstTokenMs,
        totalMs: Math.round(performance.now() - startedAt),
        usage,
      });

      if (fullText.trim().length > 0) {
        try {
          setCachedChat(cacheKey, { text: fullText, usage, finishReason });
        } catch (error) {
          console.error("[cache] write failed", error);
        }
      }
    }
  } catch (error) {
    if (isAbortError(error)) {
      console.log("[ai] client disconnected");
      return;
    }

    if (error instanceof LLMError) {
      writeError(res, error.code, error.message);
      return;
    }

    console.error("[ai] unexpected error", error);
    writeError(res, "internal_error", "服务暂时不可用");
  } finally {
    if (!res.destroyed && !res.writableEnded) {
      res.end();
    }
  }
}

function writeChunk(res: Response, chunk: StreamChunk): void {
  writeSSE(res, chunk.type, chunk);
}

function writeError(res: Response, code: string, message: string): void {
  if (res.destroyed || res.writableEnded) {
    return;
  }
  writeSSE(res, "error", { code, message });
}

function writeSSE(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isResponseFormat(value: unknown): value is ResponseFormat {
  return value === "text" || value === "json";
}
