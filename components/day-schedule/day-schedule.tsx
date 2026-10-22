import { Coffee, Frown, Smile, Target, Users, Zap } from "lucide-react";
import type { DayInLife, ScheduleItem } from "@/types";
import { SourceTag } from "@/components/common/source-tag";
import { cn } from "@/lib/utils";

const MOOD: Record<NonNullable<ScheduleItem["mood"]>, { icon: React.ComponentType<{ className?: string }>; label: string; cls: string }> = {
  focus: { icon: Target, label: "专注", cls: "bg-brand-50 text-brand" },
  social: { icon: Users, label: "社交", cls: "bg-typical-50 text-typical-700" },
  tired: { icon: Coffee, label: "疲惫", cls: "bg-neutral-100 text-neutral-500" },
  happy: { icon: Smile, label: "开心", cls: "bg-ideal-50 text-ideal-700" },
  stress: { icon: Zap, label: "压力", cls: "bg-worst-50 text-worst-700" },
};

export function DaySchedule({ day }: { day: DayInLife }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
      <p className="mb-3 text-sm text-neutral-500">{day.persona}</p>
      <ol className="relative space-y-0">
        {day.schedule.map((s, i) => {
          const m = s.mood ? MOOD[s.mood] : null;
          return (
            <li key={i} className="grid grid-cols-[52px_1fr_auto] items-start gap-3 border-b border-dashed border-neutral-100 py-2.5 last:border-0">
              <span className="font-mono text-sm font-semibold text-brand">{s.time}</span>
              <span className="text-sm text-neutral-700">{s.activity}</span>
              {m && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", m.cls)}>
                  <m.icon className="h-3 w-3" />
                  {m.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div className="rounded-xl bg-ideal-50 p-3">
          <p className="flex items-center gap-1 text-xs font-medium text-ideal-700">
            <Smile className="h-3.5 w-3.5" /> 最喜欢的部分
          </p>
          <p className="mt-1 text-sm text-neutral-700">{day.bestPart}</p>
        </div>
        <div className="rounded-xl bg-worst-50 p-3">
          <p className="flex items-center gap-1 text-xs font-medium text-worst-700">
            <Frown className="h-3.5 w-3.5" /> 最难的部分
          </p>
          <p className="mt-1 text-sm text-neutral-700">{day.hardestPart}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-400">
        <SourceTag source={day.source} />
        基于从业者描述整理（Demo 为示例内容）
      </div>
    </div>
  );
}
