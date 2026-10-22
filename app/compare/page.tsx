"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { TimeSync } from "@/components/compare/time-sync";
import { Plus, X } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { LifeRadar } from "@/components/radar/life-radar";
import { StatDisclaimer } from "@/components/common/disclaimer";
import { SourceTag } from "@/components/common/source-tag";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useRanking, useTier } from "@/lib/hooks";
import { getMajor, getPath, tierName } from "@/lib/data";
import { formatSalary, resolvePath, type ResolvedPath } from "@/lib/branch";
import { METRIC_KEYS, METRIC_LABELS, displayScore, weightedScore, weightsToOrder } from "@/lib/metrics";
import { cn } from "@/lib/utils";

const COLORS = ["#3B4CCA", "#FF8A3D", "#10B981"];
const LETTERS = ["A", "B", "C"];

type Row = { label: string; values: number[]; format: (n: number) => string; better: "high" | "low" | "none"; group: string };

function CompareView() {
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const branchChoices = useStore((s) => s.branchChoices);
  const profile = useStore((s) => s.profile);
  const tier = useTier();
  const { top } = useRanking();
  const [tab, setTab] = useState<"sync" | "table">("sync");

  const paths: ResolvedPath[] = useMemo(
    () => compareIds.map((id) => getPath(id)).filter((p) => !!p).map((p) => resolvePath(p!, tier, branchChoices[p!.id] ?? {})),
    [compareIds, tier, branchChoices],
  );

  const order = weightsToOrder(profile.valueWeights);
  const scores = paths.map((p) => weightedScore(p.metrics, profile.valueWeights));
  const best = scores.indexOf(Math.max(...scores));

  const rows: Row[] = paths.length
    ? [
        ...(["ideal", "typical", "worst"] as const).map((t) => ({
          group: "第10年月薪",
          label: { ideal: "理想情况", typical: "一般情况", worst: "最坏情况" }[t],
          values: paths.map((p) => p.scenarios.find((s) => s.type === t)!.year10Salary),
          format: (n: number) => `¥${formatSalary(n)}`,
          better: "high" as const,
        })),
        ...METRIC_KEYS.map((k) => ({ group: "6维指标", label: METRIC_LABELS[k], values: paths.map((p) => displayScore(p.metrics, k)), format: String, better: "high" as const })),
        ...["直接就业", "国内读研", "考公/选调"].map((label) => ({
          group: "毕业去向",
          label,
          values: paths.map((p) => p.graduation.destinations.find((d) => d.label.startsWith(label.slice(0, 2)))?.percent ?? 0),
          format: (n: number) => `${n}%`,
          better: "none" as const,
        })),
        { group: "大学", label: "学业压力", values: paths.map((p) => p.university.pressureLevel), format: (n: number) => `${n}/5`, better: "low" as const },
        { group: "大学", label: "学制", values: paths.map((p) => getMajor(p.majorId)?.duration ?? 4), format: (n: number) => `${n}年`, better: "none" as const },
        { group: "AI风险", label: "AI抗风险评分", values: paths.map((p) => p.metrics.aiResilience), format: String, better: "high" as const },
      ]
    : [];

  if (paths.length < 2) {
    const candidates = top.filter((m) => !compareIds.includes(m.path.id));
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-neutral-900">路径对比</h1>
        <p className="mt-1 text-sm tabular-nums text-neutral-500">选 2 到 3 条 · 已选 {paths.length}</p>
        {paths.map((p) => (
          <Badge key={p.id} className="mr-2 mt-3">
            {p.title}
            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCompare(p.id)} />
          </Badge>
        ))}
        <div className="mt-6 space-y-2">
          {candidates.map((m) => (
            <button key={m.path.id} onClick={() => toggleCompare(m.path.id)} className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-400">
              <span>
                <span className="text-xs text-neutral-400">{getMajor(m.path.majorId)?.name} →</span>
                <span className="block font-medium text-neutral-800">{m.path.title}</span>
              </span>
              <span className="flex items-center gap-1 text-sm text-neutral-900">
                <Plus className="h-4 w-4" /> 加入
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const topKey = order[0];
  const winner = paths[best];
  const winnerTopBest = paths.every((p) => displayScore(p.metrics, topKey) <= displayScore(winner.metrics, topKey));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">同一时刻的你们</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {tierName(tier)}（{tier}） · 含分叉选择
          </p>
        </div>
        {paths.length < 3 && (
          <Link href="/results">
            <Button size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" /> 再加一条
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-6 border-l-2 border-neutral-900 pl-4">
        <p className="text-lg font-semibold text-neutral-900 md:text-xl">
          {winnerTopBest ? `根据你最在乎的“${METRIC_LABELS[topKey]}”，` : `综合你在乎的“${METRIC_LABELS[order[0]]}”“${METRIC_LABELS[order[1]]}”等维度，`}
          路径{LETTERS[best]}「{winner.title}」更适合你
        </p>
      </div>

      <div className="mt-6 flex gap-1 rounded-full border border-neutral-200 p-1" role="tablist">
        {(["sync", "table"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("min-h-[36px] flex-1 cursor-pointer rounded-full text-sm transition-colors", tab === t ? "bg-brand text-snow" : "text-neutral-500")}>
            {t === "sync" ? "同一时刻的你们" : "数据对比"}
          </button>
        ))}
      </div>
      {tab === "sync" ? (
        <div className="mt-5">
          <TimeSync paths={paths} colors={COLORS} />
        </div>
      ) : (
      <>
      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${paths.length}, minmax(0, 1fr))` }}>
            {paths.map((p, i) => (
              <div key={p.id} className={cn("relative rounded-xl border p-2.5", i === best ? "border-neutral-900" : "border-neutral-200")}>
                <button onClick={() => toggleCompare(p.id)} className="absolute right-1.5 top-1.5 text-neutral-300 hover:text-neutral-500" aria-label="移出对比">
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-snow" style={{ background: COLORS[i] }}>
                  {LETTERS[i]}
                </span>
                <Link href={`/path/${p.id}`} className="mt-1 block text-sm font-medium leading-snug text-neutral-800 hover:text-neutral-500">
                  {p.title}
                </Link>
                {p.chosen.length > 0 && <p className="mt-0.5 text-[10px] text-accent-600">{p.chosen.map((c) => c.option.label).join("→")}</p>}
                <p className="mt-1.5 text-xl font-bold text-neutral-900">{scores[i]}</p>
                <p className="text-[10px] text-neutral-400">综合得分</p>
              </div>
            ))}
          </div>
          <LifeRadar series={paths.map((p, i) => ({ name: `${LETTERS[i]} ${p.title}`, metrics: p.metrics, color: COLORS[i], fillOpacity: 0.1 }))} height={300} showLegend />
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="px-4 py-3 font-medium">对比项</th>
                  {paths.map((p, i) => (
                    <th key={p.id} className="px-3 py-3 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                        {LETTERS[i]} {p.title}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => {
                  const target = r.better === "high" ? Math.max(...r.values) : r.better === "low" ? Math.min(...r.values) : NaN;
                  const allSame = r.values.every((v) => v === r.values[0]);
                  const showGroup = ri === 0 || rows[ri - 1].group !== r.group;
                  return (
                    <Fragment key={r.group + r.label}>
                      {showGroup && (
                        <tr className="bg-white">
                          <td colSpan={paths.length + 1} className="px-4 pb-1 pt-4 text-xs font-medium text-neutral-400">
                            <span className="flex items-center gap-2">
                              {r.group}
                              {r.group === "第10年月薪" && <SourceTag source={paths[0].stages[2].salary.source} />}
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-neutral-50">
                        <td className="px-4 py-2.5 text-neutral-500">{r.label}</td>
                        {r.values.map((v, i) => (
                          <td key={i} className="px-3 py-2.5">
                            <span className={cn("rounded-md px-1.5 py-0.5", !allSame && v === target ? "bg-ideal-100 font-semibold text-ideal-700" : "text-neutral-700")}>{r.format(v)}</span>
                          </td>
                        ))}
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      </>
      )}
      <StatDisclaimer className="mt-4" />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Gate requireProfile>
      <CompareView />
    </Gate>
  );
}
