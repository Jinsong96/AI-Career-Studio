import type { LifeMetrics, MetricKey } from "@/types";

export const METRIC_KEYS: MetricKey[] = ["income", "stability", "freedom", "workIntensity", "growth", "aiResilience"];

/** 面向用户的维度名；workIntensity 在界面上统一反向显示为"工作生活平衡" */
export const METRIC_LABELS: Record<MetricKey, string> = {
  income: "收入",
  stability: "稳定性",
  freedom: "自由度",
  workIntensity: "工作生活平衡",
  growth: "成长空间",
  aiResilience: "不被AI替代",
};

/** 把原始指标转换为"越高越好"的展示分 */
export function displayScore(metrics: LifeMetrics, key: MetricKey): number {
  return key === "workIntensity" ? 100 - metrics.workIntensity : metrics[key];
}

export function toRadarData(metrics: LifeMetrics) {
  return METRIC_KEYS.map((k) => ({ key: k, label: METRIC_LABELS[k], value: displayScore(metrics, k) }));
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export function applyMetricsDelta(base: LifeMetrics, delta: Partial<LifeMetrics>): LifeMetrics {
  const out = { ...base };
  for (const k of METRIC_KEYS) out[k] = clamp(out[k] + (delta[k] ?? 0));
  return out;
}

/** 排序（第1名在前）→ 权重：第1名6分……第6名1分，归一化 */
export function orderToWeights(order: MetricKey[]): Record<MetricKey, number> {
  const n = order.length;
  const total = (n * (n + 1)) / 2;
  const w = {} as Record<MetricKey, number>;
  order.forEach((k, i) => (w[k] = (n - i) / total));
  return w;
}

export function weightsToOrder(weights: Record<MetricKey, number>): MetricKey[] {
  return [...METRIC_KEYS].sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
}

/** 按用户权重计算综合得分（0-100） */
export function weightedScore(metrics: LifeMetrics, weights: Record<MetricKey, number>): number {
  let s = 0;
  for (const k of METRIC_KEYS) s += (weights[k] ?? 0) * displayScore(metrics, k);
  return Math.round(s);
}
