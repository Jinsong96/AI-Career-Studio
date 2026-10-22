"use client";

import { motion } from "framer-motion";
import { Check, GitBranch } from "lucide-react";
import type { BranchNode } from "@/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BranchNodeCard({ pathId, node }: { pathId: string; node: BranchNode }) {
  const chosen = useStore((s) => s.branchChoices[pathId]?.[node.id]);
  const choose = useStore((s) => s.choose);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="my-2 rounded-2xl border border-neutral-900 bg-white p-4 md:p-5"
    >
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 shrink-0 text-accent-600" />
        <div>
          <p className="text-xs text-neutral-400">{node.atStage}</p>
          <p className="font-semibold text-neutral-900">{node.question}</p>
        </div>
      </div>
      <div className={cn("mt-3 grid gap-2", node.options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {node.options.map((o) => {
          const active = chosen === o.id;
          const dimmed = chosen && !active;
          return (
            <button
              key={o.id}
              onClick={() => choose(pathId, node.id, o.id)}
              className={cn(
                "relative min-h-[44px] cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200",
                active ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-400",
                dimmed && "text-neutral-400",
              )}
            >
              <p className="flex items-center justify-between gap-2 font-medium text-neutral-900">
                {o.label}
                {active && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{o.tradeoff}</p>
              {o.salaryMultiplier !== 1 && (
                <p className={cn("mt-1.5 text-[11px] font-medium", o.salaryMultiplier > 1 ? "text-ideal-700" : "text-worst-700")}>
                  后续薪资 ×{o.salaryMultiplier}
                </p>
              )}
            </button>
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
