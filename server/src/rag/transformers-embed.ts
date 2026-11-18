import { pipeline } from "@xenova/transformers";
import type { EmbeddingProvider } from "./embed.js";

type FeatureExtractor = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

interface TransformersEmbeddingOptions {
  model: string;
}

export class TransformersEmbeddingProvider implements EmbeddingProvider {
  readonly name = "transformers";
  readonly dimensions = 384;

  private readonly model: string;
  private extractorPromise: Promise<FeatureExtractor> | null = null;

  constructor(options: TransformersEmbeddingOptions) {
    this.model = options.model;
  }

  private getExtractor(): Promise<FeatureExtractor> {
    this.extractorPromise ??= pipeline(
      "feature-extraction",
      this.model,
    ) as Promise<FeatureExtractor>;

    return this.extractorPromise;
  }

  async warmup(): Promise<void> {
    await this.getExtractor();
  }

  async embed(texts: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();
    const output = await extractor(texts, {
      pooling: "mean",
      normalize: true,
    });
    return output.tolist();
  }
}
