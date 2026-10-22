"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { Check, Download, Loader2 } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { Poster, POSTER_TEMPLATES, POSTER_THEMES, type PosterExtras, type PosterTemplate, type PosterTheme } from "@/components/poster/poster";
import { buildHistogram } from "@/components/story/thousand-canvas";
import { Button } from "@/components/ui/button";
import { EMPTY_PROFILE, useStore } from "@/lib/store";
import { useRanking, useTier } from "@/lib/hooks";
import { getMajor, getPath } from "@/lib/data";
import { resolvePath } from "@/lib/branch";
import { simulate, simulateMany } from "@/lib/simulate";
import { chapterContext, chapterTime, fillTemplate, universeId } from "@/lib/story";
import { cn } from "@/lib/utils";

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function Choice<T extends string>({ items, value, onChange }: { items: { id: T; name: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn("min-h-[40px] cursor-pointer rounded-xl border bg-white px-3 text-sm transition-colors", value === t.id ? "border-brand text-neutral-900" : "border-neutral-200 text-neutral-500")}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

function ShareView() {
  const params = useSearchParams();
  const compareIds = useStore((s) => s.compareIds);
  const branchChoices = useStore((s) => s.branchChoices);
  const runs = useStore((s) => s.runs);
  const seeds = useStore((s) => s.seeds);
  const chats = useStore((s) => s.chats);
  const hasProfile = useStore((s) => s.hasProfile);
  const storeProfile = useStore((s) => s.profile);
  const profile = hasProfile ? storeProfile : EMPTY_PROFILE;
  const tier = useTier();
  const { top } = useRanking();
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<PosterTheme>("indigo");
  const [template, setTemplate] = useState<PosterTemplate>((params.get("t") as PosterTemplate) || "paths");
  const [minute, setMinute] = useState(14 * 60);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  const idsParam = params.get("ids") ?? "";
  const initial = useMemo(() => {
    const fromUrl = idsParam.split(",").filter((id) => getPath(id));
    return Array.from(new Set([...fromUrl, ...compareIds, ...top.map((m) => m.path.id)])).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);
  const [selected, setSelected] = useState<string[]>(initial);
  useEffect(() => setSelected(initial), [initial]);

  const options = useMemo(() => Array.from(new Set([...initial, ...compareIds, ...top.map((m) => m.path.id), ...Object.keys(runs)])), [initial, top, compareIds, runs]);
  const paths = selected.map((id) => resolvePath(getPath(id)!, tier, branchChoices[id] ?? {}));
  const lead = paths[0];

  const quotes = useMemo(() => {
    const list = selected.flatMap((id) => (chats[id] ?? []).filter((m) => m.role === "assistant").map((m) => ({ id, text: m.text })));
    if (list.length === 0 && lead) {
      const ctx = chapterContext(lead, "w10", profile);
      list.push({ id: lead.id, text: fillTemplate(lead.futureSelfFAQ.regret, lead, ctx) });
    }
    return list;
  }, [selected, chats, lead, profile]);

  const extras = useMemo<PosterExtras>(() => {
    if (!lead) return {};
    const q = quotes[Math.min(quoteIdx, quotes.length - 1)];
    const qp = q && getPath(q.id)!;
    const choices = branchChoices[lead.id] ?? {};
    const many = template === "lived" ? simulateMany(getPath(lead.id)!, tier, choices, 1000, (seeds[lead.id] ?? 1) * 31 + 7) : [];
    const hist = many.length ? buildHistogram(many) : null;
    const current = seeds[lead.id] !== undefined ? simulate(getPath(lead.id)!, tier, choices, seeds[lead.id]) : undefined;
    const counts = { ideal: 0, typical: 0, worst: 0 };
    (runs[lead.id] ?? []).forEach((r) => counts[r.ending]++);
    return {
      minute,
      stageIndex: 1,
      quote: qp && { text: q.text, age: chapterTime("w10", profile.grade, getMajor(qp.majorId)?.duration ?? 4).age, universe: universeId(qp), title: qp.title },
      lived: hist ? { title: lead.title, universe: universeId(lead), counts, hist: { bins: hist.bins, min: hist.min, max: hist.max }, highlightBin: current ? hist.binOf(current.year10Salary) : undefined } : undefined,
      runs,
    };
  }, [lead, quotes, quoteIdx, template, tier, branchChoices, seeds, runs, minute, profile]);

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
            <p className="mb-2 text-sm font-medium text-neutral-800">模板</p>
            <Choice items={POSTER_TEMPLATES} value={template} onChange={setTemplate} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-800">风格</p>
            <Choice items={POSTER_THEMES} value={theme} onChange={setTheme} />
          </div>
          {template === "sync" && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-800">时刻 · {hhmm(minute)}</p>
              <input type="range" min={360} max={1425} step={15} value={minute} onChange={(e) => setMinute(Number(e.target.value))} aria-label="时刻" className="w-full accent-[#6070F2]" />
            </div>
          )}
          {template === "quote" && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-800">选一句话</p>
              <div className="space-y-2">
                {quotes.map((q, i) => (
                  <button key={i} onClick={() => setQuoteIdx(i)} className={cn("block w-full cursor-pointer rounded-xl border bg-white p-3 text-left text-sm text-neutral-700", quoteIdx === i ? "border-brand" : "border-neutral-200")}>
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {template !== "starmap" && template !== "quote" && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-800">{template === "sync" ? "路径（前两条）" : template === "lived" ? "路径（第一条）" : "路径（最多3条）"}</p>
              <div className="space-y-2">
                {options.map((id) => {
                  const p = getPath(id)!;
                  const on = selected.includes(id);
                  return (
                    <button key={id} onClick={() => toggle(id)} className={cn("flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm", on ? "border-brand" : "border-neutral-200")}>
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border", on ? "border-brand bg-brand text-snow" : "border-neutral-300")}>{on && <Check className="h-3.5 w-3.5" />}</span>
                      <span className="text-neutral-800">{p.title}</span>
                      {(runs[id]?.length ?? 0) > 0 && <span className="font-mono text-xs text-neutral-400">×{runs[id].length}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button size="lg" className="w-full" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            下载图片
          </Button>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          {/* 窄屏上缩放预览（父级缩放不影响导出尺寸） */}
          <div className="h-[576px] w-[324px] overflow-hidden rounded-2xl border border-neutral-200 sm:h-[640px] sm:w-[360px]">
            <div className="origin-top-left scale-90 sm:scale-100">
              <Poster ref={ref} template={template} theme={theme} paths={paths} extras={extras} />
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
