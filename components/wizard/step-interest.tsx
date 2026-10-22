"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_TAGS, TAG_GROUPS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Chip } from "./step-basic";

type ParseResult = { tags: string[]; interpretation: string; mode: "llm" | "rules" };

export function StepInterest() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [text, setText] = useState(profile.freeText ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const tags = profile.preferenceTags;
  const toggle = (t: string) => {
    const cur = useStore.getState().profile.preferenceTags;
    setProfile({ preferenceTags: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };

  const parse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/parse-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeText: text, availableTags: ALL_TAGS }),
      });
      const data = (await res.json()) as ParseResult;
      setResult(data);
      setProfile({ freeText: text, preferenceTags: Array.from(new Set([...tags, ...data.tags])) });
    } finally {
      setLoading(false);
    }
  };

  const removeAiTag = (t: string) => {
    setResult((r) => (r ? { ...r, tags: r.tags.filter((x) => x !== t) } : r));
    setProfile({ preferenceTags: tags.filter((x) => x !== t) });
  };

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">
        你对什么感兴趣
        {tags.length > 0 && <span className="ml-2 text-base font-normal tabular-nums text-neutral-400">{tags.length}</span>}
      </h1>

      {TAG_GROUPS.map((g) => (
        <div key={g.name} className="mb-5">
          <p className="mb-2 text-xs text-neutral-400">{g.name}</p>
          <div className="flex flex-wrap gap-2">
            {g.tags.map((t) => (
              <Chip key={t} active={tags.includes(t)} onClick={() => toggle(t)} className="py-1.5">
                {t}
              </Chip>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <p className="mb-2 text-sm font-medium text-neutral-800">一句话说说你想要的生活</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="比如：我想做跟动物有关的工作，但不想太累"
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-3 text-base outline-none focus:border-neutral-900"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="outline" onClick={parse} disabled={loading || !text.trim()}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI 解析
          </Button>
        </div>
        {result && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
            <p className="text-xs text-neutral-400">AI 理解到：</p>
            <p className="mt-1 text-sm text-neutral-700">{result.interpretation}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.tags.length === 0 && <span className="text-xs text-neutral-400">未匹配到标签</span>}
              {result.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
                  {t}
                  <button aria-label={`删除${t}`} onClick={() => removeAiTag(t)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
