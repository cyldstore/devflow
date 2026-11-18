import type { ChatRequest, LLMProvider, StreamChunk } from "./types.js";

const DELAY_MS = 30;

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortError());
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });

    // 防止在“检查”和“监听”之间信号已经中止
    if (signal?.aborted) {
      onAbort();
    }
  });
}

function buildReply(request: ChatRequest): string {
  if (request.responseFormat === "json") {
    return JSON.stringify({
      score: 75,
      verdict: "基本匹配",
      strengths: ["Vue 3", "TypeScript"],
      gaps: ["性能优化经验"],
      interviewTips: ["准备一个性能优化案例"],
    });
  }
  
  const lastUser = request.messages.findLast(
    (message) => message.role === "user",
  );
  const prompt = lastUser?.content.trim() || "你好";

  return `这是 mock 回复。你刚才说的是：「${prompt}」。当前模型：${request.model}。`;
}

function roughTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 2));
}

export class MockProvider implements LLMProvider {
  readonly name = "mock";
  readonly defaultModel = "mock-chat";

  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const reply = buildReply(request);
    const chars = Array.from(reply);

    for (const char of chars) {
      await sleep(DELAY_MS, request.signal);
      yield { type: "delta", text: char };
    }

    const promptTokens = request.messages.reduce(
      (sum, message) => sum + roughTokens(message.content),
      0,
    );
    const completionTokens = roughTokens(reply);

    yield {
      type: "usage",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };

    yield { type: "done", finishReason: "stop" };
  }
}

export const mockProvider = new MockProvider();
