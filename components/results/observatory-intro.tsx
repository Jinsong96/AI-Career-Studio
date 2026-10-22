"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CareerPath, SchoolTier, UserProfile } from "@/types";
import { MAJORS, PATHS } from "@/lib/data";
import { estimateRank } from "@/lib/tier";
import { chapterTime } from "@/lib/story";
import { useReducedMotion } from "@/lib/motion";

const LOG_STEP = 520;

/** 生成动画：光点 → 终端日志 → 分裂成 N 条发光曲线，末端通过 layoutId 变成路径卡片 */
export function ObservatoryIntro({ profile, tier, paths, onDone }: { profile: UserProfile; tier: SchoolTier; paths: CareerPath[]; onDone: () => void }) {
  const reduced = useReducedMotion();
  const [lines, setLines] = useState(0);
  const [split, setSplit] = useState(false);

  const logs = useMemo(() => {
    const rank = estimateRank(profile);
    const first =
      profile.inputMode === "skip"
        ? `未填写成绩 → 按层次 ${tier} 估算`
        : profile.inputMode === "score"
          ? `换算分数 ${profile.score} → 位次约 ${rank?.toLocaleString()} → 预估层次 ${tier}`
          : `解析位次 ${profile.rank} → 预估层次 ${tier}`;
    const tags = profile.preferenceTags.slice(0, 3).join("、") + (profile.preferenceTags.length > 3 ? " ..." : "");
    const start = chapterTime("y1", profile.grade, 4).year;
    const end = chapterTime("w10", profile.grade, 4).year;
    return [first, `匹配偏好标签：${tags}`, `读取示例就业数据 · ${MAJORS.length} 个专业 · ${PATHS.length} 条路径`, `推演时间线 ${start} → ${end} ...`, `观测到 ${paths.length} 个高匹配宇宙`];
  }, [profile, tier, paths.length]);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const timers = logs.map((_, i) => setTimeout(() => setLines(i + 1), 300 + i * LOG_STEP));
    timers.push(setTimeout(() => setSplit(true), 300 + logs.length * LOG_STEP));
    timers.push(setTimeout(onDone, 300 + logs.length * LOG_STEP + 1100));
    return () => timers.forEach(clearTimeout);
  }, [logs, onDone, reduced]);

  const ends = paths.map((_, i) => {
    const spread = paths.length === 1 ? 0 : (i / (paths.length - 1) - 0.5) * 2;
    return { x: 50 + spread * 34, y: 78 };
  });

  return (
    <motion.div exit={{ opacity: 0 }} onClick={onDone} className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-ink" role="dialog" aria-label="正在推演">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <filter id="g">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        {split &&
          ends.map((e, i) => (
            <motion.path
              key={i}
              d={`M50 42 C ${50 + (e.x - 50) * 0.2} 58, ${e.x} 56, ${e.x} ${e.y}`}
              stroke={i === 0 ? "#FF8A3D" : "#6070F2"}
              strokeWidth={0.35}
              fill="none"
              filter="url(#g)"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
            />
          ))}
      </svg>

      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
        <motion.span
          className="mx-auto block h-4 w-4 rounded-full bg-accent"
          animate={split ? { scale: 0.4, opacity: 0.4 } : { scale: [1, 1.25, 1], boxShadow: ["0 0 20px #FF8A3D", "0 0 44px #FF8A3D", "0 0 20px #FF8A3D"] }}
          transition={split ? { duration: 0.4 } : { repeat: Infinity, duration: 1.6 }}
        />
        <p className="mt-4 whitespace-nowrap font-mono text-xs text-[#c7ceff]">
          现在的你 · {profile.province} · {profile.grade}
        </p>
      </div>

      {split &&
        paths.map((p, i) => (
          <motion.div
            key={p.id}
            layoutId={`universe-${p.id}`}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6070F2] shadow-[0_0_24px_#6070F2]"
            style={{ left: `${ends[i].x}%`, top: `${ends[i].y}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.08 }}
          />
        ))}

      <div className="absolute bottom-6 left-4 right-4 max-w-md font-mono text-[11px] leading-relaxed text-[#9aa3d9] md:bottom-10 md:left-10 md:text-xs" aria-live="polite">
        {logs.slice(0, lines).map((l, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-accent">&gt;</span> {l}
            {i === lines - 1 && !split && <span className="caret" />}
          </motion.p>
        ))}
      </div>
      <p className="absolute right-4 top-4 font-mono text-[11px] text-[#6c74a6]">点击跳过</p>
    </motion.div>
  );
}
