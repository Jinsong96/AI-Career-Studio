"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Check, ChevronRight } from "lucide-react";
import type { MatchResult } from "@/lib/matching";
import { getMajor, FEATURED_PATH_ID } from "@/lib/data";
import { formatSalary, typicalYear10 } from "@/lib/branch";
import { useResolvedPath } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { LifeRadar } from "@/components/radar/life-radar";
import { SourceTag } from "@/components/common/source-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { universeId } from "@/lib/story";

export function PathCard({ match, index = 0 }: { match: MatchResult; index?: number }) {
  const { path } = match;
  const resolved = useResolvedPath(path.id)!;
  const major = getMajor(path.majorId);
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const demoMode = useStore((s) => s.demoMode);
  const inCompare = compareIds.includes(path.id);
  const hasChoices = resolved.chosen.length > 0;

  return (
    <motion.div
      layoutId={`universe-${path.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(
        "flex flex-col rounded-2xl border bg-white/80 p-5 backdrop-blur-sm",
        demoMode && path.id === FEATURED_PATH_ID ? "border-neutral-900" : "border-neutral-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-neutral-400">{universeId(path)}</p>
          <p className="mt-1 text-xs text-neutral-500">{major?.name}</p>
          <h3 className="mt-0.5 text-lg font-semibold leading-snug text-neutral-900">{path.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold leading-none tabular-nums text-accent-600">{match.display}%</p>
          <p className="mt-1 text-[11px] text-neutral-400">匹配度</p>
        </div>
      </div>
      <p className="mt-1.5 text-sm text-neutral-500">{path.tagline}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {match.missingSubjects.length > 0 && (
          <Badge variant="warn">
            <AlertTriangle className="h-3 w-3" /> 需要选考{match.missingSubjects.join("、")}
          </Badge>
        )}
        {hasChoices && <Badge variant="gray">{resolved.chosen.map((c) => c.option.label).join(" → ")}</Badge>}
      </div>

      <ul className="mt-4 space-y-1 border-l-2 border-neutral-200 pl-3">
        {match.reasons.map((r) => (
          <li key={r} className="text-sm text-neutral-700">
            {r}
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
        <div>
          <p className="text-xs text-neutral-400">第10年月薪</p>
          <p className="text-2xl font-semibold tabular-nums text-neutral-900">¥{formatSalary(typicalYear10(resolved))}</p>
          <SourceTag source={path.stages[2].salary.source} className="mt-1" extra="已根据你的预估院校层次调整" />
        </div>
        <div className="w-32">
          <LifeRadar series={[{ name: path.title, metrics: resolved.metrics, color: "#3B4CCA" }]} height={120} compact />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-1">
        <Link href={`/path/${path.id}/story`} className="flex-1">
          <Button className="w-full">
            进入这段人生 <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <button
          onClick={() => toggleCompare(path.id)}
          className={cn(
            "flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors",
            inCompare ? "border-neutral-900 text-neutral-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-400",
          )}
        >
          <span className={cn("flex h-4 w-4 items-center justify-center rounded border", inCompare ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300")}>
            {inCompare && <Check className="h-3 w-3" />}
          </span>
          加入对比
        </button>
      </div>
    </motion.div>
  );
}
