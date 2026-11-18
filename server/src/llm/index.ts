import { config } from "../config.js";
import { DeepSeekProvider } from "./deepseek.js";
import { mockProvider } from "./mock.js";
import type { LLMProvider } from "./types.js";

export function createProvider(): LLMProvider {
  if (config.llmProvider !== "deepseek") {
    return mockProvider;
  }

  if (!config.deepseek.apiKey) {
    console.warn("[llm] 缺少 DEEPSEEK_API_KEY，回退到 mock");
    return mockProvider;
  }

  return new DeepSeekProvider({
    apiKey: config.deepseek.apiKey,
    baseUrl: config.deepseek.baseUrl,
    defaultModel: config.deepseek.defaultModel,
  });
}

export const provider = createProvider();
console.log(`[llm] active provider: ${provider.name}, default model: ${provider.defaultModel}`);
