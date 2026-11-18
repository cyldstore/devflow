export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  signal?: AbortSignal;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type FinishReason = "stop" | "length" | "content_filter" | "unknown";

// 正常流以 done 结束；中止抛 AbortError；失败抛 LLMError。
export type StreamChunk =
  | { type: "delta"; text: string }
  | { type: "usage"; usage: TokenUsage }
  | { type: "done"; finishReason: FinishReason };

export interface LLMProvider {
  readonly name: string;
  readonly defaultModel: string;
  streamChat(request: ChatRequest): AsyncIterable<StreamChunk>;
}

export type LLMErrorCode =
  | "missing_api_key"
  | "unauthorized"
  | "rate_limited"
  | "upstream_error"
  | "network_error"
  | "invalid_response";

export type ResponseFormat = "text" | "json";

export class LLMError extends Error {
  readonly code: LLMErrorCode;
  readonly status?: number;

  constructor(code: LLMErrorCode, message: string, status?: number) {
    super(message);
    this.name = "LLMError";
    this.code = code;
    this.status = status;
  }
}
