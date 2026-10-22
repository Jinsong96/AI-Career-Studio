"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Database } from "lucide-react";
import type { ChapterId } from "@/types";
import type { ResolvedPath } from "@/lib/branch";
import { tierName } from "@/lib/data";
import { SourceTag } from "@/components/common/source-tag";
import { TierDisclaimer } from "@/components/common/disclaimer";
import { SalaryBar } from "@/components/timeline/salary-bar";
import { ScenarioCards } from "@/components/scenario/scenario-cards";
import { cn } from "@/lib/utils";

function Body({ path, chapter }: { path: ResolvedPath; chapter: ChapterId }) {
  const u = path.university;
  const scaleMax = Math.max(...path.stages.map((s) => s.salary.p90)) * 1.05;
  const stage = { w3: path.stages[0], w5: path.stages[1], w10: path.stages[2] }[chapter as "w3" | "w5" | "w10"];

  if (chapter === "prologue")
    return (
      <div className="space-y-2 text-sm text-neutral-700">
        <p>
          <span className="text-neutral-400">预估院校层次 </span>
          {tierName(path.tier)}（{path.tier}）
        </p>
        <p>{path.tierNotes[path.tier]}</p>
        <TierDisclaimer />
      </div>
    );
  if (chapter === "y1")
    return (
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {u.coreCourses.map((c) => (
            <span key={c} className={cn("rounded-md px-2 py-0.5 text-xs", u.hardestCourses.includes(c) ? "bg-accent-50 text-accent-600" : "bg-neutral-100 text-neutral-600")}>
              {c}
            </span>
          ))}
        </div>
        <p className="text-neutral-600">学业压力 {u.pressureLevel}/5 · 转专业：{u.switchMajorDifficulty}</p>
        <SourceTag source={u.source} />
      </div>
    );
  if (chapter === "y3")
    return (
      <div className="space-y-2 text-sm text-neutral-700">
        <p>考研率 {u.postgradRate} · 出国率 {u.abroadRate}</p>
        <SourceTag source={u.source} />
      </div>
    );
  if (chapter === "grad")
    return (
      <div className="space-y-2">
        {path.graduation.destinations.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-20 shrink-0 text-neutral-500">{d.label}</span>
            <span className="h-1.5 flex-1 rounded-full bg-neutral-100">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${d.percent}%` }} />
            </span>
            <span className="w-10 text-right font-mono text-xs text-neutral-700">{d.percent}%</span>
          </div>
        ))}
        <SourceTag source={path.graduation.source} />
      </div>
    );
  if (stage)
    return (
      <div className="space-y-3 text-sm">
        <p className="text-neutral-700">{stage.typicalRoles.join(" · ")}</p>
        <SalaryBar salary={stage.salary} scaleMax={scaleMax} />
        <p className="text-neutral-500">{stage.cities.join(" · ")}</p>
        <SourceTag source={stage.salary.source} extra="已根据院校层次和分叉选择调整" />
      </div>
    );
  return <ScenarioCards scenarios={path.scenarios} source={path.stages[2].salary.source} />;
}

/** 每章可折叠的"查看数据"，复用数据视图的组件和来源标签 */
export function ChapterData({ path, chapter }: { path: ResolvedPath; chapter: ChapterId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-[44px] w-full cursor-pointer items-center justify-between px-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5 font-mono">
          <Database className="h-3.5 w-3.5" /> 查看数据 · CONFIDENCE: DEMO
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-neutral-200 p-4">
              <Body path={path} chapter={chapter} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
