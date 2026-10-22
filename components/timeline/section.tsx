"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** 时间轴的一段：左侧圆点 + 竖线，滚动进入视口时展开 */
export function TimelineSection({ dot, title, sub, children, className, accent }: { dot: React.ReactNode; title: string; sub?: React.ReactNode; children: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3 }}
      className={cn("relative pb-8 pl-10 md:pl-14", className)}
    >
      <span className="absolute bottom-0 left-[15px] top-8 w-px bg-neutral-200 md:left-[19px]" />
      <span
        className={cn(
          "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-[var(--bg)] md:h-10 md:w-10 md:text-sm",
          accent ? "bg-brand text-snow" : "bg-neutral-900 text-white",
        )}
      >
        {dot}
      </span>
      <div className="mb-3 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 md:min-h-10">
        <h2 className="text-lg font-semibold text-neutral-900 md:text-xl">{title}</h2>
        {sub}
      </div>
      {children}
    </motion.section>
  );
}
