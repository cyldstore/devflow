import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type LLMProviderName = "mock" | "deepseek";
export type DeepSeekModel = "deepseek-chat" | "deepseek-reasoner";

export type EmbeddingProviderName = "hash" | "transformers";

function isLLMProviderName(value: string): value is LLMProviderName {
  return value === "mock" || value === "deepseek";
}

const envPath = fileURLToPath(new URL("../.env", import.meta.url));

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const rawPort = Number(process.env.PORT);
const rawProvider = process.env.LLM_PROVIDER ?? "mock";

if (!isLLMProviderName(rawProvider)) {
  throw new Error(`LLM_PROVIDER 只能是 mock 或 deepseek，收到：${rawProvider}`);
}

function isDeepSeekModel(value: string): value is DeepSeekModel {
  return value === "deepseek-chat" || value === "deepseek-reasoner";
}

const deepseekModel = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
const transformersModel =
  process.env.TRANSFORMERS_MODEL?.trim() ||
  "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

if (!isDeepSeekModel(deepseekModel)) {
  throw new Error(
    `DEEPSEEK_MODEL 只能是 deepseek-chat 或 deepseek-reasoner，收到：${deepseekModel}`,
  );
}

function isEmbeddingProviderName(
  value: string,
): value is EmbeddingProviderName {
  return value === "hash" || value === "transformers";
}

const rawEmbeddingProvider = process.env.EMBEDDING_PROVIDER ?? "hash";

if (!isEmbeddingProviderName(rawEmbeddingProvider)) {
  throw new Error(
    `EMBEDDING_PROVIDER 只能是 hash 或 transformers，收到：${rawEmbeddingProvider}`,
  );
}

export const config = {
  port: Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 3001,
  llmProvider: rawProvider,
  embeddingProvider: rawEmbeddingProvider,
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    defaultModel: deepseekModel,
  },
  transformers: {
    model: transformersModel,
  },
};
