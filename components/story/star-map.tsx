"use client";

import Link from "next/link";
import type { RunRecord } from "@/lib/store";
import { getPath } from "@/lib/data";
import { ENDING_STYLE } from "./ending-card";

type Props = { runs: Record<string, RunRecord[]>; currentId?: string; compact?: boolean; ink?: { strong: string; soft: string; muted: string } };

const VAR_INK = { strong: "rgb(var(--n-800))", soft: "rgb(var(--n-600))", muted: "rgb(var(--n-500))" };

/** 你的宇宙星图：现在的你 → 探索过的路径 → 分叉组合 → 结局 */
export function StarMap({ runs, currentId, compact, ink = VAR_INK }: Props) {
  const ids = Array.from(new Set([...(currentId ? [currentId] : []), ...Object.keys(runs).filter((k) => runs[k].length > 0)]));
  const rows = ids.flatMap((id) => {
    const p = getPath(id);
    if (!p) return [];
    const list = runs[id] ?? [];
    const combos = new Map<string, RunRecord[]>();
    list.forEach((r) => {
      const label =
        p.branches
          .map((b) => b.options.find((o) => o.id === r.choices[b.id])?.label)
          .filter(Boolean)
          .join(" → ") || "默认路线";
      combos.set(label, [...(combos.get(label) ?? []), r]);
    });
    if (combos.size === 0) combos.set("尚未走完", []);
    return [{ id, title: p.title, combos: Array.from(combos.entries()) }];
  });

  const lineH = 34;
  const total = Math.max(3, rows.reduce((n, r) => n + r.combos.length, 0));
  const H = total * lineH + 20;
  const W = 640;
  const rootY = H / 2;
  const used = rows.reduce((n, r) => n + r.combos.length, 0) * lineH;
  let cursor = (H - used) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="你的宇宙星图">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={30} cy={rootY} r={7} fill="#FF8A3D" filter="url(#glow)" />
      <text x={30} y={rootY + 22} textAnchor="middle" fontSize="11" fill={ink.muted}>
        现在的你
      </text>
      {rows.map((row) => {
        const top = cursor;
        const pathY = top + (row.combos.length * lineH) / 2;
        const out = (
          <g key={row.id}>
            <path d={`M30 ${rootY} C 110 ${rootY}, 110 ${pathY}, 190 ${pathY}`} stroke="#6070F2" strokeOpacity={0.6} fill="none" />
            <Link href={`/path/${row.id}/story`}>
              <circle cx={190} cy={pathY} r={6} fill="#6070F2" filter="url(#glow)" />
              <text x={200} y={pathY - 9} fontSize={compact ? 11 : 12} fill={ink.strong}>
                {row.title}
              </text>
            </Link>
            {row.combos.map(([label, list], i) => {
              const y = top + i * lineH + lineH / 2;
              const counts = { ideal: 0, typical: 0, worst: 0 };
              list.forEach((r) => counts[r.ending]++);
              return (
                <g key={label}>
                  <path d={`M190 ${pathY} C 260 ${pathY}, 260 ${y}, 330 ${y}`} stroke="#6070F2" strokeOpacity={0.35} strokeDasharray={list.length ? undefined : "3 3"} fill="none" />
                  <circle cx={330} cy={y} r={3.5} fill="#c7ceff" />
                  <text x={340} y={y + 4} fontSize="11" fill={ink.soft}>
                    {label}
                  </text>
                  {(["ideal", "typical", "worst"] as const).map((k, j) =>
                    counts[k] > 0 ? (
                      <g key={k}>
                        <circle cx={540 + j * 32} cy={y} r={4 + Math.min(6, counts[k])} fill={ENDING_STYLE[k].dot} fillOpacity={0.85} filter="url(#glow)" />
                        <text x={540 + j * 32} y={y + 3.5} textAnchor="middle" fontSize="9" fill="#0B0D1A">
                          {counts[k]}
                        </text>
                      </g>
                    ) : null,
                  )}
                </g>
              );
            })}
          </g>
        );
        cursor += row.combos.length * lineH;
        return out;
      })}
    </svg>
  );
}
