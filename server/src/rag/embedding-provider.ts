import { config } from "../config.js";
import { hashEmbedding, type EmbeddingProvider } from "./embed.js";

export async function createEmbeddingProvider(): Promise<EmbeddingProvider> {
  if (config.embeddingProvider !== "transformers") {
    return hashEmbedding;
  }

  try {
    const { TransformersEmbeddingProvider } =
      await import("./transformers-embed.js");
    const provider = new TransformersEmbeddingProvider({
      model: config.transformers.model,
    });
    await provider.warmup();
    console.log("[embed] transformers ready");
    return provider;
  } catch (error) {
    console.warn("[embed] transformers 不可用，回退 hash", error);
    return hashEmbedding;
  }
}

let providerPromise: Promise<EmbeddingProvider> | null = null;
export function getEmbeddingProvider(): Promise<EmbeddingProvider> {
  providerPromise ??= createEmbeddingProvider();
  return providerPromise;
}
