"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3, FastForward, MessageCircle, RotateCcw, Table2 } from "lucide-react";
import type { ChapterId } from "@/types";
import { useStore, EMPTY_PROFILE } from "@/lib/store";
import { useLlmAvailable, useRanking, useResolvedPath, useSimulation } from "@/lib/hooks";
import { PATHS, getMajor, getPath } from "@/lib/data";
import { CHAPTERS, branchesForChapter, chapterContext, chapterTime, fillTemplate, universeId } from "@/lib/story";
import { Typewriter } from "@/components/common/typewriter";
import { Button } from "@/components/ui/button";
import { BranchNodeCard } from "@/components/branch/branch-node";
import { ArtifactView } from "@/components/artifacts/artifact-view";
import { ReunionGroupChat } from "@/components/artifacts/reunion-group-chat";
import { EventCard } from "./event-card";
import { RollingNumber } from "./rolling-number";
import { ChapterData } from "./chapter-data";
import { EndingCard, ENDING_STYLE } from "./ending-card";
import { StarMap } from "./star-map";
import { cn } from "@/lib/utils";

const NICKNAMES = ["老周", "小林", "阿杰", "思雨", "大鹏", "可可", "阿哲", "晓晓"];
const REPLAY_STEP_MS = 1000;

export function StoryView({ id, startReplay }: { id: string; startReplay?: boolean }) {
  const router = useRouter();
  const path = useResolvedPath(id);
  const run = useSimulation(id);
  const hasProfile = useStore((s) => s.hasProfile);
  const storeProfile = useStore((s) => s.profile);
  const profile = hasProfile ? storeProfile : EMPTY_PROFILE;
  const choices = useStore((s) => s.branchChoices[id]) ?? {};
  const allRuns = useStore((s) => s.runs);
  const newSeed = useStore((s) => s.newSeed);
  const recordRun = useStore((s) => s.recordRun);
  const llm = useLlmAvailable();
  const { top } = useRanking();

  const [idx, setIdx] = useState(0);
  const [replay, setReplay] = useState(!!startReplay);
  const [llmText, setLlmText] = useState<Record<string, string>>({});
  const pending = useRef(new Set<string>());
  const touch = useRef<{ x: number; y: number } | null>(null);

  const chapter = CHAPTERS[idx];
  const sim = run?.sim;
  const gateOpen = !path || branchesForChapter(path, chapter.id).every((b) => choices[b.id]);
  const isLast = idx === CHAPTERS.length - 1;

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= CHAPTERS.length) return;
      if (to > idx && !gateOpen) return;
      setIdx(to);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [idx, gateOpen],
  );

  // 走到尾声时记录这一次人生
  useEffect(() => {
    if (isLast && sim && path) {
      recordRun(id, { seed: sim.seed, ending: sim.ending, salary: sim.year10Salary, percentile: sim.percentile, choices, eventIds: sim.triggered.map((e) => e.id) });
      setReplay(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast, sim?.seed, JSON.stringify(choices)]);

  // 再活一次：每章1秒自动推进，遇到还没选的分叉会停下
  useEffect(() => {
    if (!replay || isLast || !gateOpen) return;
    const t = setTimeout(() => go(idx + 1), REPLAY_STEP_MS);
    return () => clearTimeout(t);
  }, [replay, idx, isLast, gateOpen, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(idx + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, idx]);

  const ctx = path && chapterContext(path, chapter.id, profile, sim?.role);
  const templateText = useMemo(() => {
    if (!path || !ctx) return "";
    const tpl = path.storyChapters.find((c) => c.chapter === chapter.id)?.template ?? "";
    let text = fillTemplate(tpl, path, ctx);
    if (chapter.id === "w10" && sim) text += path.scenarios.find((s) => s.type === sim.ending)?.lifeQuality ?? "";
    return text;
  }, [path, ctx, chapter.id, sim]);

  const textKey = `${chapter.id}|${sim?.seed}|${JSON.stringify(choices)}`;
  const chapterEvents = sim && chapter.stage ? sim.triggered.filter((e) => e.stage === chapter.stage) : [];

  // 有 Key 时按章节生成场景文字；回放时直接用模板
  useEffect(() => {
    if (!llm || replay || !path || !ctx || llmText[textKey] || pending.current.has(textKey)) return;
    pending.current.add(textKey);
    fetch("/api/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, chapter: { chapter: chapter.id, label: chapter.label, year: ctx.year, age: ctx.age, fallback: templateText, events: chapterEvents.map((e) => ({ title: e.title, description: e.description })) } }),
    })
      .then((r) => r.json())
      .then((d: { text: string }) => setLlmText((m) => ({ ...m, [textKey]: d.text })))
      .catch(() => setLlmText((m) => ({ ...m, [textKey]: templateText })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llm, replay, textKey]);

  if (!path || !run || !sim || !ctx) {
    return <div className="py-20 text-center text-neutral-500">{getPath(id) ? "正在连接这个宇宙……" : "找不到这条路径"}</div>;
  }

  const text = llm && !replay ? llmText[textKey] : templateText;
  const artifacts = path.artifacts.filter((a) => a.chapter === chapter.id);
  const branches = branchesForChapter(path, chapter.id);
  const major = getMajor(path.majorId);
  const w10Age = chapterTime("w10", profile.grade, major?.duration ?? 4).age;
  const history = run.history;
  const counts = { ideal: 0, typical: 0, worst: 0 };
  history.forEach((r) => counts[r.ending]++);

  // 同学来自其他候选路径，每个专业最多一人
  const seenMajors = new Set([path.majorId]);
  const others = Array.from(new Set([...top.map((m) => m.path.id), ...PATHS.map((p) => p.id)]))
    .filter((pid) => {
      const m = getPath(pid)!.majorId;
      if (seenMajors.has(m)) return false;
      seenMajors.add(m);
      return true;
    })
    .slice(0, 3)
    .map((pid, i) => {
      const p = getPath(pid)!;
      return { name: `${NICKNAMES[(pid.length + i * 3) % NICKNAMES.length]} · ${p.title}`, text: p.reunionLine, href: `/path/${pid}/story` };
    });

  // 跳过回放：直接到结局，除非途中还有没选的分叉
  const skip = () => {
    const stop = CHAPTERS.findIndex((c, i) => i > idx && branchesForChapter(path, c.id).some((b) => !choices[b.id]));
    setIdx(stop >= 0 ? stop : CHAPTERS.length - 1);
  };

  const relive = () => {
    newSeed(id);
    setIdx(0);
    setReplay(true);
    window.scrollTo({ top: 0 });
  };

  return (
    <div
      className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-2xl px-4 pb-36 pt-4"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(idx + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Link href={hasProfile ? "/results" : "/"} className="flex min-h-[44px] items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex gap-1.5" role="tablist" aria-label="章节">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={i === idx}
              aria-label={c.label}
              onClick={() => i <= idx && go(i)}
              className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-accent" : i < idx ? "w-1.5 cursor-pointer bg-brand" : "w-1.5 bg-neutral-300")}
            />
          ))}
        </div>
        <Link href={`/path/${id}`} className="flex min-h-[44px] items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
          <Table2 className="h-3.5 w-3.5" /> 数据视图
        </Link>
      </div>

      <p className="mt-4 font-mono text-[11px] tracking-wider text-neutral-400">
        {universeId(path)} · {run.label}
      </p>

      <AnimatePresence mode="wait">
        <motion.section key={chapter.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: replay ? 0.2 : 0.4 }}>
          <div className="mt-6 flex items-end gap-3">
            <RollingNumber value={ctx.year} className="glow-text font-mono text-5xl font-semibold text-neutral-900 md:text-6xl" />
            <span className="pb-1.5 font-mono text-sm text-neutral-500">
              AGE <RollingNumber value={ctx.age} className="text-neutral-800" />
            </span>
          </div>
          <p className="mt-1 text-sm text-accent-600">
            {chapter.label} · {path.title}
          </p>

          <p className="mt-6 min-h-[5.5rem] text-[17px] leading-relaxed text-neutral-800">{text ? <Typewriter text={text} instant={replay} speed={34} /> : <span className="caret" />}</p>

          {chapter.id === "w10" && (
            <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: replay ? 0 : 0.6 }} className={cn("mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-medium", ENDING_STYLE[sim.ending].cls, ENDING_STYLE[sim.ending].text)}>
              {ENDING_STYLE[sim.ending].name}
            </motion.p>
          )}

          {chapterEvents.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="font-mono text-[11px] text-neutral-400">EVENT · 本章发生了 {chapterEvents.length} 件事</p>
              {chapterEvents.map((e, i) => (
                <EventCard key={e.id + sim.seed} event={e} index={i} fast={replay} />
              ))}
            </div>
          )}

          {artifacts.length > 0 && (
            <div className="mt-8 space-y-4">
              {artifacts.map((a, i) => (
                <ArtifactView key={i} artifact={a} path={path} ctx={ctx} triggered={sim.triggered} />
              ))}
            </div>
          )}

          {branches.map((b) => (
            <div key={b.id} className="mt-8">
              <BranchNodeCard pathId={id} node={b} />
            </div>
          ))}

          {isLast && (
            <div className="mt-6 space-y-6">
              <EndingCard path={path} sim={sim} label={run.label} />
              <div className="grid gap-2 sm:grid-cols-3">
                <Button size="lg" onClick={relive}>
                  <RotateCcw className="h-4 w-4" /> 再活一次
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push(`/path/${id}/thousand`)}>
                  <BarChart3 className="h-4 w-4" /> 看看1000个你
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push(`/path/${id}/chat`)}>
                  <MessageCircle className="h-4 w-4" /> 和{w10Age}岁的你聊聊
                </Button>
              </div>
              {history.length > 0 && (
                <p className="text-center font-mono text-xs text-neutral-500">
                  你已经活了 {history.length} 次：理想 {counts.ideal} 次、一般 {counts.typical} 次、最坏 {counts.worst} 次 ·{" "}
                  <Link href={`/share?ids=${id}&t=lived`} className="text-accent-600 underline underline-offset-4">
                    生成海报
                  </Link>
                </p>
              )}
              <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4">
                <p className="mb-2 font-mono text-[11px] text-neutral-400">STAR MAP · 你的宇宙星图</p>
                <StarMap runs={allRuns} currentId={id} />
              </div>
              <ReunionGroupChat members={others} myLine={`我在${ctx.city}，现在是${sim.role}。`} />
            </div>
          )}

          <div className="mt-8">
            <ChapterData path={path} chapter={chapter.id as ChapterId} />
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="上一章">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center font-mono text-xs text-neutral-500">
            {replay ? "REPLAYING" : !gateOpen ? "选择后继续" : `${idx + 1} / ${CHAPTERS.length}`}
          </span>
          {replay && !isLast ? (
            <Button variant="outline" onClick={skip}>
              <FastForward className="h-4 w-4" /> 跳过
            </Button>
          ) : null}
          {!isLast && (
            <Button onClick={() => go(idx + 1)} disabled={!gateOpen}>
              下一章 <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {isLast && (
            <Button onClick={relive}>
              <RotateCcw className="h-4 w-4" /> 再活一次
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
