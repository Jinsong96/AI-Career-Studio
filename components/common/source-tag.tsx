"use client";

import { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import type { Source } from "@/types";
import { cn } from "@/lib/utils";

const CONFIDENCE_LABEL: Record<Source["confidence"], string> = {
  high: "可信度高",
  medium: "可信度中",
  low: "可信度低",
  demo: "示例数据，待核实",
};

/** 每个数字旁边的来源标签：小号灰字 + 信息图标，点击弹出来源详情 */
export function SourceTag({ source, className, extra }: { source: Source; className?: string; extra?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] leading-none text-neutral-400 hover:text-neutral-600"
      >
        <Info className="h-3 w-3" />
        来源·{source.year}
        {source.confidence === "demo" && <span className="text-worst-700/80">·示例</span>}
      </button>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-5 z-40 w-64 rounded-xl border border-neutral-200 bg-white p-3 text-left text-xs text-neutral-600 shadow-xl"
        >
          <span className="mb-1 flex items-start justify-between gap-2">
            <span className="font-medium text-neutral-800">{source.name}</span>
            <X className="h-3.5 w-3.5 shrink-0 cursor-pointer text-neutral-400" onClick={() => setOpen(false)} />
          </span>
          <span className="block">年份：{source.year}</span>
          <span className="block">
            状态：<span className={source.confidence === "demo" ? "text-worst-700" : ""}>{CONFIDENCE_LABEL[source.confidence]}</span>
          </span>
          {extra && <span className="mt-1 block text-neutral-500">{extra}</span>}
          {source.url && (
            <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block text-brand underline">
              查看原始来源
            </a>
          )}
          <span className="mt-2 block border-t border-neutral-100 pt-2 text-[11px] text-neutral-400">Demo 阶段所有数字均为示例，正式版将替换为有来源的真实数据。</span>
        </span>
      )}
    </span>
  );
}
