"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ResolvedPath } from "@/lib/branch";
import { templateNarrative } from "@/lib/narrate";
import { useStore } from "@/lib/store";

/** 页面顶部的个性化叙述：优先调用 /api/narrate，失败或未配置 Key 时用模板 */
export function Narrative({ path }: { path: ResolvedPath }) {
  const profile = useStore((s) => s.profile);
  const [text, setText] = useState(() => templateNarrative(path));
  const [mode, setMode] = useState<"llm" | "template">("template");
  const [loading, setLoading] = useState(true);
  const signature = path.id + path.chosen.map((c) => c.option.id).join(",") + path.tier;

  useEffect(() => {
    const fallback = templateNarrative(path);
    setText(fallback);
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({ profile, path }),
        });
        const data = (await res.json()) as { text: string; mode: "llm" | "template" };
        if (data.mode === "llm" && data.text) {
          setText(data.text);
          setMode("llm");
        } else {
          setMode("template");
        }
      } catch {
        setMode("template");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="border-l-2 border-neutral-900 py-1 pl-4 md:pl-5">
      <p className="text-[15px] leading-relaxed text-neutral-800 md:text-base">{text}</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        {mode === "llm" ? "这段描述由AI根据数据生成" : "这段描述由模板根据数据生成"}
      </p>
    </div>
  );
}
