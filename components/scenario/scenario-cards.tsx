"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Compass, Sun, CloudSun, Cloud } from "lucide-react";
import type { Scenario, Source } from "@/types";
import { formatSalary } from "@/lib/branch";
import { SourceTag } from "@/components/common/source-tag";
import { StatDisclaimer } from "@/components/common/disclaimer";
import { cn } from "@/lib/utils";

const STYLE = {
  ideal: { name: "理想情况", icon: Sun, card: "border-ideal-100 bg-gradient-to-b from-ideal-50 to-white", text: "text-ideal-700", chip: "bg-ideal-100 text-ideal-700" },
  typical: { name: "一般情况", icon: CloudSun, card: "border-typical-100 bg-gradient-to-b from-typical-50 to-white", text: "text-typical-700", chip: "bg-typical-100 text-typical-700" },
  worst: { name: "最坏情况", icon: Cloud, card: "border-worst-100 bg-gradient-to-b from-worst-50 to-white", text: "text-worst-700", chip: "bg-worst-100 text-worst-700" },
} as const;

function ScenarioCard({ s, source }: { s: Scenario; source: Source }) {
  const [open, setOpen] = useState(false);
  const st = STYLE[s.type];
  return (
    <div className={cn("flex w-[80%] max-w-sm shrink-0 snap-start flex-col rounded-2xl border p-4 md:w-auto md:max-w-none", st.card)}>
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-sm font-semibold", st.text)}>
          <st.icon className="h-4 w-4" /> {st.name}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px]", st.chip)}>{s.percentileLabel}</span>
      </div>
      <p className="mt-3 text-xs text-neutral-400">第10年 · {s.role}</p>
      <p className="text-2xl font-semibold tabular-nums text-neutral-900">¥{formatSalary(s.year10Salary)}<span className="text-sm font-normal text-neutral-400">/月</span></p>
      <SourceTag source={source} className="mt-0.5" extra="已根据院校层次和你的分叉选择调整" />
      <p className="mt-3 text-sm text-neutral-600">{s.lifeQuality}</p>

      {s.type === "worst" && s.pivotOptions && (
        <div className="mt-3 rounded-xl border border-worst-100 bg-white p-3">
          <p className="flex items-center gap-1 text-xs font-medium text-worst-700">
            <Compass className="h-3.5 w-3.5" /> 常见的转向和补救方式
          </p>
          <ul className="mt-1.5 space-y-1">
            {s.pivotOptions.map((p) => (
              <li key={p} className="text-sm text-neutral-700">
                · {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={cn("mt-3 flex min-h-[44px] cursor-pointer items-center gap-1 text-xs font-medium", st.text)}>
        走到这一步的人通常做了什么 <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {s.howPeopleGetHere.map((h) => (
              <li key={h} className="mt-1.5 text-sm text-neutral-600">
                · {h}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ScenarioCards({ scenarios, source }: { scenarios: Scenario[]; source: Source }) {
  const order = ["ideal", "typical", "worst"] as const;
  const sorted = order.map((t) => scenarios.find((s) => s.type === t)!).filter(Boolean);
  return (
    <div>
      <div className="no-scrollbar -mr-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-2 pr-4 md:mr-0 md:grid md:grid-cols-3 md:items-stretch md:overflow-visible md:pr-0">
        {sorted.map((s) => (
          <ScenarioCard key={s.type} s={s} source={source} />
        ))}
      </div>
      <StatDisclaimer className="mt-3" />
    </div>
  );
}
