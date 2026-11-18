import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { chunkText } from "../rag/chunk.js";
import { getEmbeddingProvider } from "../rag/embedding-provider.js";
import { cosineSimilarity } from "../rag/embed.js";

const MAX_CONTENT_LENGTH = 200_000;

type DocType = "resume" | "knowledge";

interface IndexRequest {
  docType: DocType;
  docId: string;
  title: string;
  content: string;
  sourceUpdatedAt: string | null;
}

type ParseResult =
  | { ok: true; value: IndexRequest }
  | { ok: false; error: string };

interface SearchRequest {
  query: string;
  docType?: DocType;
  docId?: string;
  topK: number;
}

interface SearchResult {
  docType: DocType;
  docId: string;
  chunkIndex: number;
  title: string;
  content: string;
  score: number;
}

interface ChunkRow {
  doc_type: DocType;
  doc_id: string;
  chunk_index: number;
  title: string;
  content: string;
  embedding: string | null;
}

export const ragRouter = Router();

ragRouter.post("/index", async (req: Request, res: Response) => {
  const parsed = parseIndexRequest(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { docType, docId, title, content, sourceUpdatedAt } = parsed.value;

  try {
    const chunks = chunkText(content);
    if (chunks.length === 0) {
      res.status(400).json({ error: "content 切块后为空" });
      return;
    }

    const provider = await getEmbeddingProvider();
    const vectors = await provider.embed(chunks.map((chunk) => chunk.content));

    if (vectors.length !== chunks.length) {
      throw new Error("embedding 数量与切块数量不一致");
    }

    const dimensions = vectors[0]?.length ?? 0;
    if (dimensions !== provider.dimensions) {
      throw new Error(
        `embedding 维度不一致：期望 ${provider.dimensions}，实际 ${dimensions}`,
      );
    }

    const deleteChunks = db.prepare(
      "DELETE FROM chunks WHERE doc_type = ? AND doc_id = ?",
    );

    const insertChunk = db.prepare(`
      INSERT INTO chunks
  (doc_type, doc_id, chunk_index, title, content, embedding, source_updated_at, created_at, updated_at)
VALUES
  (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const replaceChunks = db.transaction(() => {
      deleteChunks.run(docType, docId);

      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        const vector = vectors[index];

        if (!chunk || !vector) {
          throw new Error(`第 ${index} 个切块或向量缺失`);
        }

        insertChunk.run(
          docType,
          docId,
          chunk.index,
          title,
          chunk.content,
          JSON.stringify(vector),
          sourceUpdatedAt,
        );
      }
    });

    replaceChunks();

    console.log(
      `[rag] indexed ${docType}:${docId} (${chunks.length} chunks, ${provider.name})`,
    );

    res.json({
      ok: true,
      docType,
      docId,
      chunks: chunks.length,
      dimensions,
      provider: provider.name,
    });
  } catch (error) {
    console.error("[rag] index failed", error);
    res.status(500).json({ error: "索引失败，请稍后重试" });
  }
});

function parseIndexRequest(body: unknown): ParseResult {
  if (!isRecord(body)) {
    return { ok: false, error: "请求体必须是 JSON 对象" };
  }

  const docType = body.docType;
  if (!isDocType(docType)) {
    return { ok: false, error: "docType 只能是 resume 或 knowledge" };
  }

  const docId = body.docId;
  if (typeof docId !== "string" || docId.trim() === "") {
    return { ok: false, error: "docId 必须是非空字符串" };
  }

  let title = "";
  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return { ok: false, error: "title 必须是字符串" };
    }
    title = body.title.trim();
  }

  const content = body.content;
  if (typeof content !== "string" || content.trim() === "") {
    return { ok: false, error: "content 必须是非空字符串" };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: `content 不能超过 ${MAX_CONTENT_LENGTH} 字符` };
  }

  let sourceUpdatedAt: string | null = null;

  if (body.sourceUpdatedAt !== undefined) {
    if (typeof body.sourceUpdatedAt !== "string") {
      return { ok: false, error: "sourceUpdatedAt 必须是字符串" };
    }
    sourceUpdatedAt = body.sourceUpdatedAt;
  }

  return {
    ok: true,
    value: {
      docType,
      docId: docId.trim(),
      title,
      content,
      sourceUpdatedAt,
    },
  };
}

function isDocType(value: unknown): value is DocType {
  return value === "resume" || value === "knowledge";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

ragRouter.post("/search", async (req: Request, res: Response) => {
  const parsed = parseSearchRequest(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { query, docType, docId, topK } = parsed.value;

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (docType) {
      conditions.push("doc_type = ?");
      params.push(docType);
    }
    if (docId) {
      conditions.push("doc_id = ?");
      params.push(docId);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = db
      .prepare(
        `SELECT doc_type, doc_id, chunk_index, title, content, embedding
         FROM chunks
         ${where}`,
      )
      .all(...params) as ChunkRow[];

    if (rows.length === 0) {
      res.json({ ok: true, query, provider: null, results: [] });
      return;
    }

    const provider = await getEmbeddingProvider();
    const [queryVector] = await provider.embed([query]);

    if (!queryVector) {
      throw new Error("query embedding 为空");
    }
    if (queryVector.length !== provider.dimensions) {
      throw new Error("query embedding 维度不一致");
    }

    const results: SearchResult[] = [];

    for (const row of rows) {
      if (!row.embedding) continue;

      let vector: unknown;
      try {
        vector = JSON.parse(row.embedding);
      } catch {
        continue;
      }

      if (!isNumberArray(vector) || vector.length !== queryVector.length) {
        continue;
      }

      results.push({
        docType: row.doc_type,
        docId: row.doc_id,
        chunkIndex: row.chunk_index,
        title: row.title,
        content: row.content,
        score: cosineSimilarity(queryVector, vector),
      });
    }

    results.sort((a, b) => b.score - a.score);

    res.json({
      ok: true,
      query,
      provider: provider.name,
      results: results.slice(0, topK),
    });
  } catch (error) {
    console.error("[rag] search failed", error);
    res.status(500).json({ error: "检索失败，请稍后重试" });
  }
});

type SearchParseResult =
  | { ok: true; value: SearchRequest }
  | { ok: false; error: string };

function parseSearchRequest(body: unknown): SearchParseResult {
  if (!isRecord(body)) {
    return { ok: false, error: "请求体必须是 JSON 对象" };
  }

  const query = body.query;
  if (typeof query !== "string" || query.trim() === "") {
    return { ok: false, error: "query 必须是非空字符串" };
  }
  if (query.length > 2000) {
    return { ok: false, error: "query 不能超过 2000 字符" };
  }

  let docType: DocType | undefined;
  if (body.docType !== undefined) {
    if (!isDocType(body.docType)) {
      return { ok: false, error: "docType 只能是 resume 或 knowledge" };
    }
    docType = body.docType;
  }

  let docId: string | undefined;
  if (body.docId !== undefined) {
    if (typeof body.docId !== "string" || body.docId.trim() === "") {
      return { ok: false, error: "docId 必须是非空字符串" };
    }
    docId = body.docId.trim();
  }

  let topK = 5;
  if (body.topK !== undefined) {
    if (
      typeof body.topK !== "number" ||
      !Number.isInteger(body.topK) ||
      body.topK < 1 ||
      body.topK > 20
    ) {
      return { ok: false, error: "topK 必须是 1 到 20 的整数" };
    }
    topK = body.topK;
  }

  return {
    ok: true,
    value: {
      query: query.trim(),
      docType,
      docId,
      topK,
    },
  };
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "number")
  );
}

ragRouter.get("/status", (req: Request, res: Response) => {
  const docType = req.query.docType;
  const docId = req.query.docId;

  if (!isDocType(docType) || typeof docId !== "string" || docId.trim() === "") {
    res.status(400).json({ error: "docType/docId 不合法" });
    return;
  }

  const row = db
    .prepare(
      `
    SELECT COUNT(*) AS count, MAX(source_updated_at) AS source_updated_at
    FROM chunks
    WHERE doc_type = ? AND doc_id = ?
  `,
    )
    .get(docType, docId.trim()) as {
    count: number;
    source_updated_at: string | null;
  };

  res.json({
    ok: true,
    indexed: row.count > 0,
    chunks: row.count,
    sourceUpdatedAt: row.source_updated_at,
  });
});
