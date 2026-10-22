import type { CareerPath, LifeEvent, LifeMetrics, SchoolTier } from "@/types";
import { resolvePath } from "./branch";
import { applyMetricsDelta } from "./metrics";

export type Ending = "ideal" | "typical" | "worst";

export type SimResult = {
  seed: number;
  triggered: LifeEvent[];
  percentile: number;
  ending: Ending;
  year10Salary: number;
  role: string;
  metrics: LifeMetrics;
};

export const STAGE_ORDER: LifeEvent["stage"][] = ["university", "graduation", "year3", "year5", "year10"];
const MAX_PER_STAGE = 2;
const TIER_SHIFT: Record<SchoolTier, number> = { T1: 6, T2: 3, T3: 0, T4: -3, T5: -6 };

/** 可复现的伪随机数 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

export function endingOf(percentile: number): Ending {
  return percentile >= 80 ? "ideal" : percentile >= 20 ? "typical" : "worst";
}

/** 按百分位在 p10/p50/p90 之间分段线性插值，两端按斜率外推并设上下限 */
export function salaryAtPercentile(pct: number, s: { p10: number; p50: number; p90: number }): number {
  const lo = (s.p50 - s.p10) / 40;
  const hi = (s.p90 - s.p50) / 40;
  let v: number;
  if (pct <= 10) v = Math.max(s.p10 * 0.5, s.p10 - (10 - pct) * lo);
  else if (pct <= 50) v = s.p10 + (pct - 10) * lo;
  else if (pct <= 90) v = s.p50 + (pct - 50) * hi;
  else v = Math.min(s.p90 * 1.3, s.p90 + (pct - 90) * hi);
  return Math.round(v / 500) * 500;
}

export function simulate(path: CareerPath, tier: SchoolTier, choices: Record<string, string>, seed: number): SimResult {
  const rng = mulberry32(seed);
  const resolved = resolvePath(path, tier, choices);
  const triggered: LifeEvent[] = [];

  for (const stage of STAGE_ORDER) {
    const pool = path.events.filter((e) => e.stage === stage);
    // Fisher-Yates 打乱，避免排在前面的事件总是先触发
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let n = 0;
    for (const e of pool) {
      if (n < MAX_PER_STAGE && rng() < e.probability) {
        triggered.push(e);
        n++;
      }
    }
  }
  triggered.sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  const raw = 50 + TIER_SHIFT[tier] + triggered.reduce((s, e) => s + e.percentileShift, 0);
  const percentile = Math.min(99, Math.max(1, Math.round(raw)));
  const ending = endingOf(percentile);
  const y10 = resolved.stages.find((s) => s.yearsAfterGrad === 10) ?? resolved.stages[resolved.stages.length - 1];

  return {
    seed,
    triggered,
    percentile,
    ending,
    year10Salary: salaryAtPercentile(percentile, y10.salary),
    role: resolved.scenarios.find((s) => s.type === ending)?.role ?? y10.typicalRoles[0],
    metrics: triggered.reduce((m, e) => (e.metricsDelta ? applyMetricsDelta(m, e.metricsDelta) : m), resolved.metrics),
  };
}

export function runLabel(seed: number, index: number): string {
  return `RUN #${String(seed % 10000).padStart(4, "0")}-${String(index).padStart(2, "0")}`;
}

export function simulateMany(path: CareerPath, tier: SchoolTier, choices: Record<string, string>, n: number, baseSeed = 1): SimResult[] {
  return Array.from({ length: n }, (_, i) => simulate(path, tier, choices, baseSeed * 7919 + i * 104729));
}

export type EventInsight = { event: LifeEvent; ratio: number; withRate: number; withoutRate: number; count: number };

/** 找出对进入理想结局影响最大的事件：触发者的理想率 / 未触发者的理想率 */
export function topEventInsight(runs: SimResult[]): EventInsight | null {
  const ids = new Map<string, LifeEvent>();
  runs.forEach((r) => r.triggered.forEach((e) => ids.set(e.id, e)));
  let best: EventInsight | null = null;
  for (const e of Array.from(ids.values())) {
    if (e.percentileShift <= 0) continue;
    const withRuns = runs.filter((r) => r.triggered.some((t) => t.id === e.id));
    const without = runs.length - withRuns.length;
    if (withRuns.length < 30 || without < 30) continue;
    const withRate = withRuns.filter((r) => r.ending === "ideal").length / withRuns.length;
    const withoutIdeal = runs.filter((r) => r.ending === "ideal" && !r.triggered.some((t) => t.id === e.id)).length;
    const withoutRate = withoutIdeal / without;
    const ratio = withoutRate > 0 ? withRate / withoutRate : withRate > 0 ? Infinity : 0;
    if (!best || ratio > best.ratio) best = { event: e, ratio, withRate, withoutRate, count: withRuns.length };
  }
  return best;
}
