export interface TextChunk {
  index: number;
  content: string;
}

export interface ChunkOptions {
  maxChars?: number; // 每块最大字符数
  overlapChars?: number; // 相邻块之间的重叠字符数
}

export function chunkText(
  text: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const maxChars = Math.max(100, options.maxChars ?? 500);
  // 0 <= overlapchars < maxchars
  const overlapChars = Math.min(
    Math.max(options.overlapChars ?? 80, 0),
    maxChars - 1,
  );

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    let cut = end;

    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf("\n\n", end);
      // 只有当 \n\n 位于当前块的“后半段”（超过 50% 的位置）时才使用它做切点
      if (boundary > start + Math.floor(maxChars * 0.5)) {
        cut = boundary;
      }
    }

    const content = normalized.slice(start, cut).trim();
    if (content) {
      chunks.push({ index: chunks.length, content });
    }

    if (cut >= normalized.length) break;

    start = Math.max(cut - overlapChars, start + 1);
  }

  return chunks;
}
