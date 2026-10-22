"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, GitBranch } from "lucide-react";
import type { BranchNode, BranchOption } from "@/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** 另一个你此刻……：由未选选项的 description 和 stageOverrides 生成 */
export function ghostText(o: BranchOption): string {
  const life = o.stageOverrides?.find((x) => x.lifeDescription)?.lifeDescription;
  return `另一个你此刻${o.description}。${life ?? o.tradeoff}`;
}

export function BranchNodeCard({ pathId, node }: { pathId: string; node: BranchNode }) {
  const chosen = useStore((s) => s.branchChoices[pathId]?.[node.id]);
  const choose = useStore((s) => s.choose);
  const [ghost, setGhost] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="my-2 rounded-2xl border border-brand/60 bg-white p-4 shadow-[0_0_32px_rgba(96,112,242,0.18)] md:p-5"
    >
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 shrink-0 text-accent-600" />
        <div>
          <p className="font-mono text-xs text-neutral-400">BRANCH · {node.atStage}</p>
          <p className="font-semibold text-neutral-900">{node.question}</p>
        </div>
      </div>
      <div className={cn("mt-3 grid gap-2", node.options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {node.options.map((o) => {
          const active = chosen === o.id;
          const dimmed = !!chosen && !active;
          return (
            <div
              key={o.id}
              onMouseEnter={() => dimmed && setGhost(o.id)}
              onMouseLeave={() => setGhost((g) => (g === o.id ? null : g))}
              className={cn(
                "relative rounded-xl border transition-all duration-200",
                active ? "border-brand bg-brand-50" : dimmed ? "border-dashed border-neutral-300 opacity-45 hover:opacity-80" : "border-neutral-200 bg-white hover:border-neutral-400",
              )}
            >
              <button onClick={() => choose(pathId, node.id, o.id)} className="block min-h-[44px] w-full cursor-pointer p-3 text-left">
                <p className="flex items-center justify-between gap-2 font-medium text-neutral-900">
                  {o.label}
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-snow">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{o.tradeoff}</p>
                {o.salaryMultiplier !== 1 && (
                  <p className={cn("mt-1.5 text-[11px] font-medium", o.salaryMultiplier > 1 ? "text-ideal-700" : "text-worst-700")}>后续薪资 ×{o.salaryMultiplier}</p>
                )}
              </button>
              {dimmed && (
                <button onClick={() => setGhost((g) => (g === o.id ? null : o.id))} className="min-h-[36px] w-full cursor-pointer border-t border-dashed border-neutral-300 px-3 text-left font-mono text-[11px] text-neutral-500">
                  另一个你此刻……
                </button>
              )}
              <AnimatePresence>
                {ghost === o.id && dimmed && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-3 pb-3 text-xs leading-relaxed text-neutral-600">
                    {ghostText(o)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function BranchBreadcrumb({ pathId, nodes }: { pathId: string; nodes: BranchNode[] }) {
  const choices = useStore((s) => s.branchChoices[pathId]) ?? {};
  const rewindTo = useStore((s) => s.rewindTo);
  const reset = useStore((s) => s.resetChoices);
  const picked = nodes.map((n) => ({ node: n, option: n.options.find((o) => o.id === choices[n.id]) })).filter((x) => x.option);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="text-neutral-500">你的选择路径：</span>
      {picked.length === 0 && <span className="text-neutral-400">—</span>}
      {picked.map((p, i) => (
        <span key={p.node.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-neutral-300">→</span>}
          <button
            onClick={() => rewindTo(pathId, nodes.slice(nodes.indexOf(p.node)).map((n) => n.id))}
            title="点击回退到这个选择之前"
            className="cursor-pointer rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700"
          >
            {p.option!.label}
          </button>
        </span>
      ))}
      {picked.length > 0 && (
        <button onClick={() => reset(pathId)} className="ml-1 cursor-pointer text-xs text-neutral-400 hover:text-neutral-900">
          重置
        </button>
      )}
    </div>
  );
}
