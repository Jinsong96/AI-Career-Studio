"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const LINES = ["正在分析你的位次……", "正在匹配专业……", "正在推演10年后的你……"];

export function GeneratingOverlay() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(LINES.length - 1, x + 1)), 750);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/95">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
      <motion.p key={n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-neutral-600" aria-live="polite">
        {LINES[n]}
      </motion.p>
    </motion.div>
  );
}
