"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, MapPin, Smile, Target, Users, Zap } from "lucide-react";
import type { ScheduleItem } from "@/types";
import type { ResolvedPath } from "@/lib/branch";
import { getMajor } from "@/lib/data";
import { chapterTime } from "@/lib/story";
import { useStore, EMPTY_PROFILE } from "@/lib/store";

const MOOD: Record<NonNullable<ScheduleItem["mood"]>, { icon: React.ComponentType<{ className?: string }>; label: string; cls: string }> = {
  focus: { icon: Target, label: "专注", cls: "text-brand" },
  social: { icon: Users, label: "社交", cls: "text-typical-700" },
  tired: { icon: Coffee, label: "疲惫", cls: "text-neutral-500" },
  happy: { icon: Smile, label: "开心", cls: "text-ideal-700" },
  stress: { icon: Zap, label: "压力", cls: "text-worst-700" },
};
const STAGES = [
  { idx: 0, chapter: "w3", label: "第3年" },
  { idx: 1, chapter: "w5", label: "第5年" },
  { idx: 2, chapter: "w10", label: "第10年" },
] as const;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** 这个时刻最接近的活动：取开始时间不晚于该时刻的最后一项 */
export function activityAt(schedule: ScheduleItem[], minute: number): ScheduleItem {
  const sorted = [...schedule].sort((a, b) => toMin(a.time) - toMin(b.time));
  return sorted.filter((s) => toMin(s.time) <= minute).pop() ?? sorted[0];
}

export function TimeSync({ paths, colors }: { paths: ResolvedPath[]; colors: string[] }) {
  const hasProfile = useStore((s) => s.hasProfile);
  const storeProfile = useStore((s) => s.profile);
  const grade = (hasProfile ? storeProfile : EMPTY_PROFILE).grade;
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [minute, setMinute] = useState(14 * 60);
  const st = STAGES[stage];

  return (
    <div>
      <div className="rounded-3xl border border-neutral-200 bg-white/60 p-5 text-center">
        <p className="glow-text font-mono text-6xl font-semibold tabular-nums text-neutral-900">{fmt(minute)}</p>
        <p className="mt-1 font-mono text-xs text-neutral-500">工作{st.label} · 同一时刻</p>
        <div className="mt-4 flex justify-center gap-2">
          {STAGES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStage(i as 0 | 1 | 2)}
              className={"min-h-[40px] cursor-pointer rounded-full border px-4 text-sm transition-colors " + (stage === i ? "border-brand bg-brand-50 text-neutral-900" : "border-neutral-200 text-neutral-500")}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={6 * 60}
          max={23 * 60 + 45}
          step={15}
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          aria-label="一天中的时刻"
          className="mt-5 w-full accent-[#6070F2]"
        />
        <div className="flex justify-between font-mono text-[10px] text-neutral-400">
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${paths.length}, minmax(0, 1fr))` }}>
        {paths.map((p, i) => {
          const s = p.stages[st.idx];
          const act = activityAt(p.dayInLife.schedule, minute);
          const m = MOOD[act.mood ?? "focus"];
          const year = chapterTime(st.chapter, grade, getMajor(p.majorId)?.duration ?? 4).year;
          return (
            <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white/70 p-3 md:p-4" style={{ boxShadow: `inset 0 2px 0 ${colors[i]}` }}>
              <p className="truncate text-xs font-medium text-neutral-800">{p.title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-neutral-400">
                {year} · {s.typicalRoles[0]}
              </p>
              <AnimatePresence mode="wait">
                <motion.div key={act.time + act.activity} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-3 min-h-[96px]">
                  <p className="font-mono text-xs text-neutral-500">{act.time}</p>
                  <p className="mt-1 text-sm leading-snug text-neutral-900">{act.activity}</p>
                  <p className={"mt-2 flex items-center gap-1 text-[11px] " + m.cls}>
                    <m.icon className="h-3 w-3" /> {m.label}
                  </p>
                </motion.div>
              </AnimatePresence>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{s.cities[0]}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
