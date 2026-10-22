import { Compass, Sparkles } from "lucide-react";
import type { ResolvedPath } from "@/lib/branch";
import { formatSalary } from "@/lib/branch";
import type { SimResult } from "@/lib/simulate";
import { SourceTag } from "@/components/common/source-tag";
import { StatDisclaimer } from "@/components/common/disclaimer";
import { cn } from "@/lib/utils";

export const ENDING_STYLE = {
  ideal: { name: "理想结局", cls: "border-ideal-500/60 bg-ideal-50", text: "text-ideal-700", dot: "#10B981" },
  typical: { name: "一般结局", cls: "border-typical-500/60 bg-typical-50", text: "text-typical-700", dot: "#3B82F6" },
  worst: { name: "最坏结局", cls: "border-worst-500/60 bg-worst-50", text: "text-worst-700", dot: "#F59E0B" },
} as const;

export function EndingCard({ path, sim, label }: { path: ResolvedPath; sim: SimResult; label: string }) {
  const st = ENDING_STYLE[sim.ending];
  const scenario = path.scenarios.find((s) => s.type === sim.ending)!;
  const lastChallenge = [...sim.triggered].reverse().find((e) => e.tone === "challenge");
  return (
    <div className={cn("rounded-3xl border p-5", st.cls)}>
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-sm font-semibold", st.text)}>
          <Sparkles className="h-4 w-4" /> {st.name}
        </span>
        <span className="font-mono text-[11px] text-neutral-500">{label}</span>
      </div>
      <p className="mt-3 text-xs text-neutral-500">第10年 · {sim.role}</p>
      <p className="text-3xl font-semibold tabular-nums text-neutral-900">
        ¥{formatSalary(sim.year10Salary)}
        <span className="text-sm font-normal text-neutral-500">/月</span>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-[11px] text-neutral-500">
        <span>PERCENTILE {sim.percentile}</span>
        <SourceTag source={path.stages[2].salary.source} extra="按这一次的百分位在 p10/p50/p90 之间插值，并已按院校层次和分叉调整" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">{scenario.lifeQuality}</p>

      {sim.triggered.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-neutral-500">这一次的关键事件</p>
          <ul className="space-y-1">
            {sim.triggered.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: { positive: "#10B981", neutral: "#3B82F6", challenge: "#F59E0B" }[e.tone] }} />
                {e.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sim.ending === "worst" && (
        <div className="mt-4 rounded-2xl border border-worst-500/40 bg-white/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-worst-700">
            <Compass className="h-3.5 w-3.5" /> 这一次的转机
          </p>
          <p className="mt-1 text-sm text-neutral-700">{lastChallenge?.copingTip ?? scenario.pivotOptions?.[0]}</p>
          <p className="mb-1 mt-3 text-xs text-neutral-500">常见的转向方式</p>
          <ul className="space-y-0.5 text-sm text-neutral-700">
            {scenario.pivotOptions?.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </div>
      )}
      <StatDisclaimer className="mt-4" />
    </div>
  );
}
