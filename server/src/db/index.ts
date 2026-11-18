import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const migrations: string[] = [
  `
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      embedding TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks (doc_type, doc_id);

    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route TEXT NOT NULL,
      model TEXT,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      first_token_ms INTEGER,
      total_ms INTEGER,
      cached INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cache (
      cache_key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT
    );
  `,
  `ALTER TABLE chunks ADD COLUMN chunk_index INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE chunks ADD COLUMN source_updated_at TEXT;`,
];

const dbPath = fileURLToPath(new URL("../../data/devflow.db", import.meta.url));
mkdirSync(dirname(dbPath), { recursive: true });


export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

function migrate(): void {
  const current = db.pragma("user_version", { simple: true }) as number;

  for (let version = current; version < migrations.length; version++) {
    db.transaction(() => {
      db.exec(migrations[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

migrate();

export interface DatabaseStatus {
  ok: boolean;
  tables: number;
  schemaVersion: number;
}

export function getDatabaseStatus(): DatabaseStatus {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM sqlite_master
       WHERE type = 'table' AND name IN ('chunks', 'metrics', 'cache')`,
    )
    .get() as { count: number };

  return {
    ok: row.count === 3,
    tables: row.count,
    schemaVersion: db.pragma("user_version", { simple: true }) as number,
  };
}
