import { forwardRef } from "react";
import type { ResolvedPath } from "@/lib/branch";
import { formatSalary, typicalYear10 } from "@/lib/branch";
import { getMajor } from "@/lib/data";
import { cn } from "@/lib/utils";

export type PosterTheme = "indigo" | "sunrise" | "paper";

export const POSTER_THEMES: { id: PosterTheme; name: string }[] = [
  { id: "indigo", name: "星夜靛蓝" },
  { id: "sunrise", name: "日出暖橙" },
  { id: "paper", name: "极简纸张" },
];

const T = {
  indigo: { root: "bg-gradient-to-b from-[#1b2163] via-[#2c3aa8] to-[#3B4CCA] text-white", card: "bg-white/10 ring-1 ring-white/15", sub: "text-indigo-200", accent: "text-[#FFB07A]", moment: "bg-white/10" },
  sunrise: { root: "bg-gradient-to-b from-[#FF8A3D] via-[#FFB26B] to-[#FFE3C4] text-[#3a1d05]", card: "bg-white/70", sub: "text-[#8a4a17]", accent: "text-[#3B4CCA]", moment: "bg-[#FFF3EA]" },
  paper: { root: "bg-[#FAF8F3] text-neutral-900", card: "bg-white ring-1 ring-neutral-200", sub: "text-neutral-500", accent: "text-[#3B4CCA]", moment: "bg-neutral-50" },
} as const;

function momentOf(p: ResolvedPath): string {
  if (p.posterMoment) return p.posterMoment;
  const s = p.dayInLife.schedule[Math.floor(p.dayInLife.schedule.length / 2)];
  return `${s.time} ${s.activity}`;
}

/** 9:16 竖版海报，固定 360×640 逻辑尺寸，导出时按 3 倍像素 */
export const Poster = forwardRef<HTMLDivElement, { paths: ResolvedPath[]; theme: PosterTheme; name?: string }>(({ paths, theme, name }, ref) => {
  const t = T[theme];
  return (
    <div ref={ref} className={cn("relative flex h-[640px] w-[360px] flex-col overflow-hidden p-6", t.root)} style={{ fontFamily: '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif' }}>
      {theme === "indigo" && (
        <>
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#FF8A3D]/30 blur-2xl" />
          <div className="absolute -left-10 bottom-24 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </>
      )}
      <div className="relative">
        <p className={cn("text-xs tracking-[0.2em]", t.sub)}>PARALLEL LIFE</p>
        <h1 className="mt-1 text-[30px] font-bold leading-tight">我的平行人生</h1>
        <p className={cn("mt-1 text-[13px]", t.sub)}>{name ? `${name}的` : ""}{paths.length}个十年后，你更想过哪一种？</p>
      </div>

      <div className="relative mt-5 flex flex-1 flex-col gap-3">
        {paths.map((p, i) => (
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
      </div>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[15px] font-bold">职业平行人生</p>
          <p className={cn("text-[10px]", t.sub)}>在选专业之前，先试穿你的未来</p>
          <p className={cn("mt-1 text-[8px] opacity-70", t.sub)}>Demo 示例数据 · 统计分布不代表个人预测</p>
        </div>
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-white p-1.5">
          <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-[2px]">
            {Array.from({ length: 25 }).map((_, i) => (
              <span key={i} className={cn("rounded-[1px]", [0, 1, 3, 4, 5, 9, 12, 15, 19, 20, 21, 23, 24, 7, 17].includes(i) ? "bg-neutral-900" : "bg-neutral-200")} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
Poster.displayName = "Poster";
