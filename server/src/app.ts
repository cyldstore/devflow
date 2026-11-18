import express from "express";
import { getDatabaseStatus } from "./db/index.js";
import { aiRouter } from "./routes/ai.js";
import { ragRouter } from "./routes/rag.js";
import { statsRouter } from "./routes/stats.js";
import { vitalsRouter } from "./routes/vitals.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    const database = getDatabaseStatus();

    res.status(database.ok ? 200 : 503).json({
      ok: database.ok,
      service: "devflow-server",
      db: database.ok ? "ok" : "error",
      tables: database.tables,
      schemaVersion: database.schemaVersion,
      time: new Date().toISOString(),
    });
  });

  app.use("/api/ai", aiRouter);
  app.use("/api/rag", ragRouter);
  app.use("/api/stats", statsRouter);
  app.use(
    "/api/vitals",
    express.text({ type: "text/plain", limit: "32kb" }),
    vitalsRouter,
  );

  return app;
}
