import { db } from "./index.js";
import { percentile } from "./percentile.js";

export const VITAL_NAMES = ["FP", "FCP", "LCP", "CLS"] as const;
export type VitalName = (typeof VITAL_NAMES)[number];

export interface VitalMetricInput {
  name: VitalName;
  value: number;
}

export interface VitalsInput {
  sessionId: string;
  route: string;
  device: "mobile" | "desktop";
  sampleRate: number;
  metrics: VitalMetricInput[];
}

const THRESHOLDS: Record<VitalName, [number, number]> = {
  FP: [1800, 3000],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
};

export function ratingFor(
  name: VitalName,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

const insert = db.prepare(`
  INSERT INTO web_vitals
    (session_id, route, metric, value, rating, device, sample_rate)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertAll = db.transaction((input: VitalsInput) => {
  for (const metric of input.metrics) {
    insert.run(
      input.sessionId,
      input.route,
      metric.name,
      metric.value,
      ratingFor(metric.name, metric.value),
      input.device,
      input.sampleRate,
    );
  }
});

export function insertVitals(input: VitalsInput): void {
  insertAll(input);
}

export interface VitalMetricStats {
  samples: number;
  p50: number | null;
  p75: number | null;
  p95: number | null;
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface VitalsStats {
  days: number;
  sessions: number;
  totalSamples: number;
  metrics: Record<VitalName, VitalMetricStats>;
}

interface VitalStatsRow {
  session_id: string;
  metric: string;
  value: number;
  rating: string;
}

const selectRange = db.prepare(`
  SELECT session_id, metric, value, rating
  FROM web_vitals
  WHERE created_at >= datetime('now', ?)
`);

export function getVitalsStats(days: number): VitalsStats {
  const rows = selectRange.all(`-${days} days`) as VitalStatsRow[];

  const buckets = new Map<
    VitalName,
    { values: number[]; good: number; needsImprovement: number; poor: number }
  >();

  for (const name of VITAL_NAMES) {
    buckets.set(name, { values: [], good: 0, needsImprovement: 0, poor: 0 });
  }

  const sessions = new Set<string>();

  for (const row of rows) {
    const bucket = buckets.get(row.metric as VitalName);
    if (!bucket) continue;

    sessions.add(row.session_id);
    bucket.values.push(row.value);

    if (row.rating === "good") bucket.good += 1;
    else if (row.rating === "needs-improvement") bucket.needsImprovement += 1;
    else bucket.poor += 1;
  }

  const metrics = {} as Record<VitalName, VitalMetricStats>;

  for (const name of VITAL_NAMES) {
    const bucket = buckets.get(name);
    if (!bucket) continue;

    const sorted = [...bucket.values].sort((a, b) => a - b);

    metrics[name] = {
      samples: sorted.length,
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p95: percentile(sorted, 0.95),
      good: bucket.good,
      needsImprovement: bucket.needsImprovement,
      poor: bucket.poor,
    };
  }

  return {
    days,
    sessions: sessions.size,
    totalSamples: rows.length,
    metrics,
  };
}
