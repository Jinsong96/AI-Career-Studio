import { forwardRef } from "react";
import type { ResolvedPath } from "@/lib/branch";
import { formatSalary, typicalYear10 } from "@/lib/branch";
import { getMajor } from "@/lib/data";
import type { RunRecord } from "@/lib/store";
import { activityAt } from "@/components/compare/time-sync";
import { StarMap } from "@/components/story/star-map";
import { cn } from "@/lib/utils";

export type PosterTheme = "indigo" | "sunrise" | "paper";
export type PosterTemplate = "paths" | "sync" | "quote" | "lived" | "starmap";

export const POSTER_THEMES: { id: PosterTheme; name: string }[] = [
  { id: "indigo", name: "星夜靛蓝" },
  { id: "sunrise", name: "日出暖橙" },
  { id: "paper", name: "极简纸张" },
];

export const POSTER_TEMPLATES: { id: PosterTemplate; name: string }[] = [
  { id: "paths", name: "我的平行人生" },
  { id: "sync", name: "同一时刻的两个你" },
  { id: "quote", name: "未来的我说" },
  { id: "lived", name: "我活了N次" },
  { id: "starmap", name: "宇宙星图" },
];

const T = {
  indigo: { root: "bg-gradient-to-b from-[#1b2163] via-[#2c3aa8] to-[#3B4CCA] text-snow", card: "bg-snow/10 ring-1 ring-snow/15", sub: "text-indigo-200", accent: "text-[#FFB07A]", moment: "bg-snow/10", ink: { strong: "#FFFFFF", soft: "#C7D2FE", muted: "#A5B4FC" } },
  sunrise: { root: "bg-gradient-to-b from-[#FF8A3D] via-[#FFB26B] to-[#FFE3C4] text-[#3a1d05]", card: "bg-snow/70", sub: "text-[#8a4a17]", accent: "text-[#3B4CCA]", moment: "bg-[#FFF3EA]", ink: { strong: "#3a1d05", soft: "#6b3a12", muted: "#8a4a17" } },
  paper: { root: "bg-[#FAF8F3] text-[#171717]", card: "bg-snow ring-1 ring-[#E5E5E5]", sub: "text-[#737373]", accent: "text-[#3B4CCA]", moment: "bg-[#F5F5F4]", ink: { strong: "#171717", soft: "#404040", muted: "#737373" } },
} as const;

const ENDING_COLOR = { ideal: "#10B981", typical: "#3B82F6", worst: "#F59E0B" } as const;

function momentOf(p: ResolvedPath): string {
  if (p.posterMoment) return p.posterMoment;
  const s = p.dayInLife.schedule[Math.floor(p.dayInLife.schedule.length / 2)];
  return `${s.time} ${s.activity}`;
}

export type PosterExtras = {
  minute?: number;
  stageIndex?: number;
  quote?: { text: string; age: number; universe: string; title: string };
  lived?: { title: string; universe: string; counts: { ideal: number; typical: number; worst: number }; hist: { bins: number[]; min: number; max: number }; highlightBin?: number };
  runs?: Record<string, RunRecord[]>;
};

type Props = { template: PosterTemplate; theme: PosterTheme; paths: ResolvedPath[]; extras?: PosterExtras };

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** 9:16 竖版海报，固定 360×640 逻辑尺寸，导出时按 3 倍像素；所有模板都带"示例数据"标记 */
export const Poster = forwardRef<HTMLDivElement, Props>(({ template, theme, paths, extras = {} }, ref) => {
  const t = T[theme];
  const header = {
    paths: ["我的平行人生", `${paths.length}个十年后，你更想过哪一种？`],
    sync: [`${hhmm(extras.minute ?? 840)}，两个我`, "同一时刻，两种人生"],
    quote: [`来自${extras.quote?.age ?? 32}岁的我`, extras.quote?.universe ?? ""],
    lived: [`我活了${(extras.lived?.counts.ideal ?? 0) + (extras.lived?.counts.typical ?? 0) + (extras.lived?.counts.worst ?? 0)}次`, extras.lived?.title ?? ""],
    starmap: ["我的宇宙星图", "我探索过的路、分叉和结局"],
  }[template];

  return (
    <div ref={ref} className={cn("relative flex h-[640px] w-[360px] flex-col overflow-hidden p-6", t.root)} style={{ fontFamily: '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif' }}>
      {theme === "indigo" && (
        <>
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#FF8A3D]/30 blur-2xl" />
          <div className="absolute -left-10 bottom-24 h-40 w-40 rounded-full bg-snow/10 blur-2xl" />
        </>
      )}
      <div className="relative">
        <p className={cn("text-xs tracking-[0.2em]", t.sub)}>PARALLEL LIFE</p>
        <h1 className="mt-1 text-[30px] font-bold leading-tight">{header[0]}</h1>
        <p className={cn("mt-1 text-[13px]", t.sub)}>{header[1]}</p>
      </div>

      <div className="relative mt-5 flex flex-1 flex-col gap-3">
        {template === "paths" &&
          paths.map((p, i) => (
            <div key={p.id} className={cn("flex-1 rounded-2xl p-4", t.card)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn("text-[11px]", t.sub)}>
                    {["平行人生 A", "平行人生 B", "平行人生 C"][i]} · {getMajor(p.majorId)?.name}
                  </p>
                  <p className="mt-0.5 text-[17px] font-bold leading-snug">{p.title}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-[17px] font-bold", t.accent)}>¥{formatSalary(typicalYear10(p))}</p>
                  <p className={cn("text-[9px]", t.sub)}>第10年月薪·一般</p>
                </div>
              </div>
              <p className={cn("mt-1 text-[12px] leading-snug", t.sub)}>{p.tagline}</p>
              <p className={cn("mt-2 rounded-lg px-2.5 py-1.5 text-[12px] leading-snug", t.moment)}>“{momentOf(p)}”</p>
            </div>
          ))}

        {template === "sync" &&
          paths.slice(0, 2).map((p, i) => {
            const s = p.stages[extras.stageIndex ?? 1];
            const act = activityAt(p.dayInLife.schedule, extras.minute ?? 840);
            return (
              <div key={p.id} className={cn("flex flex-1 flex-col justify-between rounded-2xl p-5", t.card)}>
                <div>
                  <p className={cn("text-[11px]", t.sub)}>{["这个我", "那个我"][i]} · {s.cities[0]}</p>
                  <p className="mt-0.5 text-[16px] font-bold">{p.title}</p>
                </div>
                <p className="text-[19px] font-semibold leading-snug">“{act.activity}”</p>
                <p className={cn("text-[11px]", t.sub)}>
                  工作{s.label} · {s.typicalRoles[0]}
                </p>
              </div>
            );
          })}

        {template === "quote" && extras.quote && (
          <div className={cn("flex flex-1 flex-col justify-center rounded-3xl p-6", t.card)}>
            <p className={cn("text-[44px] leading-none", t.accent)}>“</p>
            <p className="mt-1 text-[19px] font-medium leading-relaxed">{extras.quote.text}</p>
            <p className={cn("mt-5 text-[12px]", t.sub)}>—— {extras.quote.age}岁的我，{extras.quote.title}</p>
            <p className={cn("mt-1 text-[10px]", t.sub)}>AI 根据数据扮演的角色</p>
          </div>
        )}

        {template === "lived" && extras.lived && (
          <div className={cn("flex flex-1 flex-col rounded-3xl p-5", t.card)}>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(["ideal", "typical", "worst"] as const).map((k) => (
                <div key={k}>
                  <p className="text-[30px] font-bold" style={{ color: ENDING_COLOR[k] }}>
                    {extras.lived!.counts[k]}
                  </p>
                  <p className={cn("text-[11px]", t.sub)}>{{ ideal: "理想", typical: "一般", worst: "最坏" }[k]}</p>
                </div>
              ))}
            </div>
            <p className={cn("mt-5 text-[11px]", t.sub)}>1000个我的第10年月薪分布</p>
            <div className="mt-2 flex h-[180px] items-end gap-[2px]">
              {extras.lived.hist.bins.map((n, i) => {
                const max = Math.max(...extras.lived!.hist.bins);
                return <span key={i} className="flex-1 rounded-t-sm" style={{ height: `${(n / max) * 100}%`, background: i === extras.lived!.highlightBin ? "#FF8A3D" : "currentColor", opacity: i === extras.lived!.highlightBin ? 1 : 0.35 }} />;
              })}
            </div>
            <div className={cn("mt-1 flex justify-between text-[10px]", t.sub)}>
              <span>¥{formatSalary(extras.lived.hist.min)}</span>
              <span className="text-[#FF8A3D]">● 最近一次的我</span>
              <span>¥{formatSalary(extras.lived.hist.max)}</span>
            </div>
          </div>
        )}

        {template === "starmap" && (
          <div className={cn("flex flex-1 items-center rounded-3xl p-3", t.card)}>
            <StarMap runs={extras.runs ?? {}} currentId={paths[0]?.id} compact ink={t.ink} />
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[15px] font-bold">职业平行人生</p>
          <p className={cn("mt-1 text-[8px] opacity-70", t.sub)}>示例数据 · 统计分布不代表个人预测</p>
        </div>
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-snow p-1.5">
          <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-[2px]">
            {Array.from({ length: 25 }).map((_, i) => (
              <span key={i} className={cn("rounded-[1px]", [0, 1, 3, 4, 5, 9, 12, 15, 19, 20, 21, 23, 24, 7, 17].includes(i) ? "bg-[#171717]" : "bg-[#E5E5E5]")} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
Poster.displayName = "Poster";
