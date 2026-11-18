import { LLMError } from "./types.js";
import type {
  ChatRequest,
  FinishReason,
  LLMErrorCode,
  LLMProvider,
  StreamChunk,
  TokenUsage,
} from "./types.js";

interface DeepSeekOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

interface DeepSeekUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface DeepSeekStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: DeepSeekUsage | null;
}

export class DeepSeekProvider implements LLMProvider {
  readonly name = "deepseek";
  readonly defaultModel: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: DeepSeekOptions) {
    if (!options.apiKey) {
      throw new LLMError("missing_api_key", "缺少 DEEPSEEK_API_KEY");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.deepseek.com").replace(
      /\/+$/,
      "",
    );
    this.defaultModel = options.defaultModel ?? "deepseek-chat";
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const body: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
      stream: true,
      stream_options: { include_usage: true },
    };

    if (
      request.temperature !== undefined &&
      request.model !== "deepseek-reasoner"
    ) {
      body.temperature = request.temperature;
    }
    if (request.maxTokens !== undefined) {
      body.max_tokens = request.maxTokens;
    }
    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal: request.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new LLMError("network_error", "无法连接 DeepSeek");
    }

    if (!response.ok) {
      console.error("[deepseek] HTTP", response.status);
      throw new LLMError(
        mapHttpStatus(response.status),
        `DeepSeek 请求失败（${response.status}）`,
        response.status,
      );
    }

    if (!response.body) {
      throw new LLMError("invalid_response", "DeepSeek 没有返回流");
    }

    let finishReason: FinishReason = "unknown";

    for await (const line of readLines(response.body)) {
      if (!line.startsWith("data:")) {
        continue;
      }

      const payload = line.slice(5).trim();
      if (!payload) {
        continue;
      }
      if (payload === "[DONE]") {
        break;
      }

      const chunk = parseChunk(payload);
      const choice = chunk.choices?.[0];

      const text = choice?.delta?.content;
      if (typeof text === "string" && text.length > 0) {
        yield { type: "delta", text };
      }

      const reason = choice?.finish_reason;
      if (reason) {
        finishReason = mapFinishReason(reason);
      }

      if (chunk.usage) {
        yield { type: "usage", usage: mapUsage(chunk.usage) };
      }
    }

    yield { type: "done", finishReason };
  }
}

async function* readLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      // 数据读完，退出循环
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }

      // 二进制字节流解码成字符串
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
        buffer = buffer.slice(newlineIndex + 1);
        yield line;
        newlineIndex = buffer.indexOf("\n");
      }
    }

    buffer += decoder.decode();
    if (buffer.length > 0) {
      yield buffer.replace(/\r$/, "");
    }
  } finally {
    reader.releaseLock();
  }
}

function parseChunk(payload: string): DeepSeekStreamChunk {
  try {
    return JSON.parse(payload) as DeepSeekStreamChunk;
  } catch {
    throw new LLMError("invalid_response", "DeepSeek 返回了无法解析的数据");
  }
}

function mapUsage(usage: DeepSeekUsage): TokenUsage {
  return {
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
}

function mapFinishReason(reason: string): FinishReason {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content_filter";
    default:
      return "unknown";
  }
}

function mapHttpStatus(status: number): LLMErrorCode {
  if (status === 401 || status === 403) {
    return "unauthorized";
  }
  if (status === 429) {
    return "rate_limited";
  }
  return "upstream_error";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
