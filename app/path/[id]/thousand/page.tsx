"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { ThousandCanvas } from "@/components/story/thousand-canvas";
import { Button } from "@/components/ui/button";
import { useSimulation, useTier } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { getPath } from "@/lib/data";
import { formatSalary } from "@/lib/branch";
import { simulate, topEventInsight, type SimResult } from "@/lib/simulate";
import { universeId } from "@/lib/story";

const N = 1000;
const BATCH = 100;

function Thousand({ id }: { id: string }) {
  const path = getPath(id);
  const tier = useTier();
  const choices = useStore((s) => s.branchChoices[id]);
  const run = useSimulation(id);
  const [runs, setRuns] = useState<SimResult[]>([]);
  const [done, setDone] = useState(false);

  // 分批计算，避免卡住页面
  useEffect(() => {
    if (!path || !run) return;
    let cancelled = false;
    const acc: SimResult[] = [];
    const base = run.sim.seed * 31 + 7;
    const step = (start: number) => {
      if (cancelled) return;
      for (let i = start; i < Math.min(N, start + BATCH); i++) acc.push(simulate(path, tier, choices ?? {}, base + i * 104729));
      if (acc.length < N) setTimeout(() => step(start + BATCH), 0);
      else setRuns(acc);
    };
    step(0);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tier, JSON.stringify(choices), run?.sim.seed]);

  if (!path || !run) return null;
  const counts = { ideal: 0, typical: 0, worst: 0 };
  runs.forEach((r) => counts[r.ending]++);
  const sorted = runs.map((r) => r.year10Salary).sort((a, b) => a - b);
  const insight = runs.length ? topEventInsight(runs) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-4">
      <Link href={`/path/${id}/story`} className="inline-flex min-h-[44px] items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> 回到故事
      </Link>
      <p className="font-mono text-[11px] tracking-wider text-neutral-400">
        {universeId(path)} · SAMPLE n={N.toLocaleString()} · CONFIDENCE: DEMO
      </p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">1000个你</h1>
      <p className="mt-1 text-sm text-neutral-500">{path.title} · 第10年月薪分布</p>

      <div className="mt-6 rounded-3xl border border-neutral-200 bg-white/60 p-3">
        {runs.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center font-mono text-xs text-neutral-500">SIMULATING…</div>
        ) : (
          <ThousandCanvas runs={runs} highlight={run.sim.year10Salary} onDone={() => setDone(true)} />
        )}
        <div className="mt-2 flex justify-center gap-4 font-mono text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" /> 理想
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#3B82F6]" /> 一般
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> 最坏
          </span>
        </div>
      </div>

      {runs.length > 0 && (
        <div className={done ? "opacity-100 transition-opacity duration-500" : "opacity-0"}>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {(
              [
                ["理想", counts.ideal, "text-ideal-700"],
                ["一般", counts.typical, "text-typical-700"],
                ["最坏", counts.worst, "text-worst-700"],
              ] as const
            ).map(([k, n, cls]) => (
              <div key={k} className="rounded-2xl border border-neutral-200 bg-white/60 p-3">
                <p className={`font-mono text-2xl font-semibold ${cls}`}>{((n / N) * 100).toFixed(1)}%</p>
                <p className="text-xs text-neutral-500">{k}结局</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-700">
            中位数 ¥{formatSalary(sorted[Math.floor(N / 2)])}，中间80%的人在 ¥{formatSalary(sorted[Math.floor(N * 0.1)])} 到 ¥{formatSalary(sorted[Math.floor(N * 0.9)])} 之间。
          </p>
          {insight && (
            <p className="mt-3 border-l-2 border-accent pl-3 text-sm leading-relaxed text-neutral-800">
              在1000个你中，影响最大的事件是『{insight.event.title}』：
              {Number.isFinite(insight.ratio)
                ? `触发了这个事件的人，进入理想结局的比例是没触发的 ${insight.ratio.toFixed(1)} 倍（${(insight.withRate * 100).toFixed(0)}% 对 ${(insight.withoutRate * 100).toFixed(0)}%）。`
                : `进入理想结局的人，全部触发过这个事件。`}
            </p>
          )}
          <p className="mt-6 text-xs text-neutral-400">这是基于示例数据的模拟分布，不代表对你个人的预测</p>
          <Link href={`/path/${id}/story?replay=1`} className="mt-6 block">
            <Button size="lg" className="w-full" onClick={() => useStore.getState().newSeed(id)}>
              <RotateCcw className="h-4 w-4" /> 再活一次
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ThousandPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Gate>
      <Thousand id={id} />
    </Gate>
  );
}
