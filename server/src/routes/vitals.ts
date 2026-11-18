import { Router } from "express";
import {
  insertVitals,
  VITAL_NAMES,
  type VitalMetricInput,
  type VitalName,
  type VitalsInput,
} from "../db/vitals.js";

export const vitalsRouter = Router();

const MAX_METRICS = 6;

const LIMITS: Record<VitalName, number> = {
  FP: 600_000,
  FCP: 600_000,
  LCP: 600_000,
  CLS: 100,
};

vitalsRouter.post("/", (req, res) => {
  const parsed = parseVitals(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  insertVitals(parsed.value);
  res.status(204).end();
});

type ParseResult =
  | { ok: true; value: VitalsInput }
  | { ok: false; error: string };

function parseVitals(body: unknown): ParseResult {
  let data: unknown = body;

  if (typeof body === "string") {
    try {
      data = JSON.parse(body);
    } catch {
      return { ok: false, error: "请求体不是合法 JSON" };
    }
  }

  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "请求体必须是对象" };
  }

  const record = data as Record<string, unknown>;

  const sessionId = record.sessionId;
  if (
    typeof sessionId !== "string" ||
    sessionId.length === 0 ||
    sessionId.length > 100
  ) {
    return { ok: false, error: "sessionId 不合法" };
  }

  const route = typeof record.route === "string" ? record.route : "";
  if (route.length > 200) {
    return { ok: false, error: "route 过长" };
  }

  const device = record.device;
  if (device !== "mobile" && device !== "desktop") {
    return { ok: false, error: "device 只能是 mobile 或 desktop" };
  }

  const sampleRate = record.sampleRate;
  if (
    typeof sampleRate !== "number" ||
    !Number.isFinite(sampleRate) ||
    sampleRate < 0 ||
    sampleRate > 1
  ) {
    return { ok: false, error: "sampleRate 必须在 0 到 1 之间" };
  }

  const rawMetrics = record.metrics;
  if (
    !Array.isArray(rawMetrics) ||
    rawMetrics.length === 0 ||
    rawMetrics.length > MAX_METRICS
  ) {
    return { ok: false, error: `metrics 必须是 1 到 ${MAX_METRICS} 条` };
  }

  const metrics: VitalMetricInput[] = [];
  const seen = new Set<string>();

  for (const item of rawMetrics) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "metric 必须是对象" };
    }

    const metric = item as Record<string, unknown>;
    const name = metric.name;

    if (
      typeof name !== "string" ||
      !(VITAL_NAMES as readonly string[]).includes(name)
    ) {
      return { ok: false, error: "metric.name 只能是 FP/FCP/LCP/CLS" };
    }
    if (seen.has(name)) {
      return { ok: false, error: `metric 重复：${name}` };
    }

    const value = metric.value;
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > LIMITS[name as VitalName]
    ) {
      return { ok: false, error: `${name} 的值超出范围` };
    }

    seen.add(name);
    metrics.push({ name: name as VitalName, value });
  }

  return {
    ok: true,
    value: { sessionId, route, device, sampleRate, metrics },
  };
}
