"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend } from "recharts";
import type { LifeMetrics } from "@/types";
import { METRIC_KEYS, METRIC_LABELS, displayScore } from "@/lib/metrics";

const SHORT: Record<string, string> = { income: "收入", stability: "稳定", freedom: "自由", workIntensity: "平衡", growth: "成长", aiResilience: "抗AI" };

export type RadarSeries = { name: string; metrics: LifeMetrics; color: string; dashed?: boolean; fillOpacity?: number };

export function LifeRadar({ series, height = 280, showLegend = false, compact = false }: { series: RadarSeries[]; height?: number; showLegend?: boolean; compact?: boolean }) {
  const data = METRIC_KEYS.map((k) => {
    const row: Record<string, number | string> = { label: compact ? SHORT[k] : METRIC_LABELS[k] };
    series.forEach((s, i) => (row[`s${i}`] = displayScore(s.metrics, k)));
    return row;
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius={compact ? "62%" : "72%"} margin={compact ? { top: 4, right: 8, bottom: 4, left: 8 } : { top: 8, right: 30, bottom: 8, left: 30 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: compact ? 10 : 12, fill: "#64748b" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {series.map((s, i) => (
            <Radar
              key={s.name + i}
              name={s.name}
              dataKey={`s${i}`}
              stroke={s.color}
              strokeWidth={s.dashed ? 1.5 : 2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              fill={s.color}
              fillOpacity={s.dashed ? 0 : s.fillOpacity ?? 0.18}
              isAnimationActive={!compact}
              animationDuration={500}
            />
          ))}
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
