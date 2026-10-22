"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { LifeEvent } from "@/types";
import { SourceTag } from "@/components/common/source-tag";
import { cn } from "@/lib/utils";

const TONE = {
  positive: { label: "好运", cls: "border-ideal-500/60 shadow-[0_0_28px_rgba(16,185,129,0.25)]", chip: "bg-ideal-100 text-ideal-700", icon: TrendingUp },
  neutral: { label: "变化", cls: "border-typical-500/60 shadow-[0_0_28px_rgba(59,130,246,0.25)]", chip: "bg-typical-100 text-typical-700", icon: Sparkles },
  challenge: { label: "挑战", cls: "border-worst-500/60 shadow-[0_0_28px_rgba(245,158,11,0.25)]", chip: "bg-worst-100 text-worst-700", icon: TrendingDown },
} as const;

/** 人生事件：像抽卡一样翻转出现 */
export function EventCard({ event, index = 0, fast }: { event: LifeEvent; index?: number; fast?: boolean }) {
  const t = TONE[event.tone];
  useEffect(() => {
    if (fast) return;
    const id = setTimeout(() => navigator.vibrate?.(event.tone === "challenge" ? [20, 40, 20] : 25), 400 + index * 350);
    return () => clearTimeout(id);
  }, [event, index, fast]);

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ delay: fast ? 0 : 0.35 + index * 0.35, duration: fast ? 0.2 : 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        className={cn("rounded-2xl border bg-white p-4", t.cls)}
      >
        <div className="flex items-center justify-between">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", t.chip)}>
            <t.icon className="h-3 w-3" />
            {t.label}
          </span>
          <span className="font-mono text-[11px] text-neutral-400">P={event.probability.toFixed(2)}</span>
        </div>
        <p className="mt-2 font-semibold text-neutral-900">{event.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{event.description}</p>
        {event.copingTip && (
          <p className="mt-3 flex gap-1.5 rounded-xl bg-neutral-50 p-2.5 text-xs leading-relaxed text-neutral-700">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            {event.copingTip}
          </p>
        )}
        <SourceTag source={event.source} className="mt-2" />
      </motion.div>
    </div>
  );
}
