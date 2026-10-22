"use client";

import { AnimatePresence, motion } from "framer-motion";

/** 翻页时数字向上滚动 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span className={"relative inline-flex overflow-hidden tabular-nums " + (className ?? "")}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
