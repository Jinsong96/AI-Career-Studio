"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { Check, Download, Loader2 } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { Poster, POSTER_THEMES, type PosterTheme } from "@/components/poster/poster";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useRanking, useTier } from "@/lib/hooks";
import { getPath } from "@/lib/data";
import { resolvePath } from "@/lib/branch";
import { cn } from "@/lib/utils";

function ShareView() {
  const params = useSearchParams();
  const compareIds = useStore((s) => s.compareIds);
  const branchChoices = useStore((s) => s.branchChoices);
  const tier = useTier();
  const { top } = useRanking();
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<PosterTheme>("indigo");
  const [busy, setBusy] = useState(false);

  const idsParam = params.get("ids") ?? "";
  const initial = useMemo(() => {
    const fromUrl = idsParam.split(",").filter((id) => getPath(id));
    const base = [...fromUrl, ...compareIds, ...top.map((m) => m.path.id)];
    return Array.from(new Set(base)).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);
  const [selected, setSelected] = useState<string[]>(initial);
  useEffect(() => setSelected(initial), [initial]);

  const options = useMemo(() => Array.from(new Set([...initial, ...compareIds, ...top.map((m) => m.path.id)])), [initial, top, compareIds]);
  const paths = selected.map((id) => resolvePath(getPath(id)!, tier, branchChoices[id] ?? {}));

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : s.length >= 3 ? [...s.slice(1), id] : [...s, id]));

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      await document.fonts?.ready;
      const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = "我的平行人生.png";
      a.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6">
      <h1 className="text-2xl font-bold text-neutral-900">分享海报</h1>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_360px]">
        <div className="order-2 space-y-6 md:order-1">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">风格</p>
            <div className="flex gap-2">
              {POSTER_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn("min-h-[44px] flex-1 cursor-pointer rounded-xl border bg-white px-3 py-2.5 text-sm transition-colors", theme === t.id ? "border-neutral-900 font-medium text-neutral-900" : "border-neutral-200 bg-white text-neutral-600")}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">路径（最多3条）</p>
            <div className="space-y-2">
              {options.map((id) => {
                const p = getPath(id)!;
                const on = selected.includes(id);
                const branched = Object.keys(branchChoices[id] ?? {}).length > 0;
                return (
                  <button key={id} onClick={() => toggle(id)} className={cn("flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm", on ? "border-neutral-900" : "border-neutral-200")}>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border", on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300")}>{on && <Check className="h-3.5 w-3.5" />}</span>
                    <span className="text-neutral-800">{p.title}</span>
                    {branched && <span className="text-xs text-neutral-400">含分叉</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            下载图片
          </Button>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          {/* 窄屏上缩放预览（父级缩放不影响导出尺寸） */}
          <div className="h-[576px] w-[324px] overflow-hidden rounded-2xl border border-neutral-200 sm:h-[640px] sm:w-[360px]">
            <div className="origin-top-left scale-90 sm:scale-100">
              <Poster ref={ref} paths={paths} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Gate requireProfile>
      <Suspense>
        <ShareView />
      </Suspense>
    </Gate>
  );
}
