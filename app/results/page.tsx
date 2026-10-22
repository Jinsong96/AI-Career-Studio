"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ObservatoryIntro } from "@/components/results/observatory-intro";
import { GitCompare, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { PathCard } from "@/components/path-card/path-card";
import { StatDisclaimer } from "@/components/common/disclaimer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useEstimatedRank, useRanking, useTier } from "@/lib/hooks";
import { MAJORS, tierName } from "@/lib/data";
import { isCoveredProvince } from "@/lib/tier";
import { cn } from "@/lib/utils";

function Results() {
  const profile = useStore((s) => s.profile);
  const demoMode = useStore((s) => s.demoMode);
  const compareIds = useStore((s) => s.compareIds);
  const pinnedIds = useStore((s) => s.pinnedIds);
  const pin = useStore((s) => s.pin);
  const tier = useTier();
  const rank = useEstimatedRank();
  const { ranked, top, alternatives } = useRanking();
  const [showAlt, setShowAlt] = useState(false);
  const [showMajors, setShowMajors] = useState(false);
  const introPending = useStore((s) => s.introPending);
  const setIntroPending = useStore((s) => s.setIntroPending);
  const endIntro = useCallback(() => setIntroPending(false), [setIntroPending]);

  const list = showAlt ? alternatives : top;
  const pinned = useMemo(
    () => pinnedIds.map((id) => ranked.find((r) => r.path.id === id)!).filter((r) => r && !list.some((l) => l.path.id === r.path.id)),
    [pinnedIds, ranked, list],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <section className="border-b border-neutral-200 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {demoMode && <p className="mb-1 text-xs text-neutral-400">示例学生</p>}
            <h1 className="text-xl font-bold text-neutral-900 md:text-2xl">
              {profile.grade} · {profile.province}
              {profile.inputMode !== "skip" && rank ? ` · 位次约 ${rank.toLocaleString()}` : ""}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {tierName(tier)}（{tier}） · {profile.subjects.join("+")}
              {!isCoveredProvince(profile.province) && " · 按通用规则估算"}
            </p>
          </div>
          <Link href="/start">
            <Button size="sm" variant="outline">
              <SlidersHorizontal className="h-3.5 w-3.5" /> 修改信息
            </Button>
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.preferenceTags.map((t) => (
            <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400">Demo 使用简化估算，不是真实录取数据 · 薪资已根据你的预估院校层次调整</p>
      </section>

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">{showAlt ? "另外 4 个宇宙" : `我们观测到了 ${top.length} 个平行宇宙里的你`}</h2>
        {compareIds.length >= 2 && (
          <Link href="/compare">
            <Button size="sm">
              <GitCompare className="h-3.5 w-3.5" /> 对比 {compareIds.length} 条
            </Button>
          </Link>
        )}
      </div>

      <LayoutGroup>
        {introPending ? (
          <ObservatoryIntro profile={profile} tier={tier} paths={top.map((m) => m.path)} onDone={endIntro} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={showAlt ? "alt" : "top"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((m, i) => (
                <PathCard key={m.path.id} match={m} index={i} />
              ))}
              {pinned.map((m, i) => (
                <PathCard key={m.path.id} match={m} index={list.length + i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </LayoutGroup>

      <StatDisclaimer className="mt-4" />

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <button
          onClick={() => setShowAlt((v) => !v)}
          className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
        >
          <RefreshCw className="h-4 w-4" />
          {showAlt ? "回到最匹配的路径" : "都不喜欢？换一组"}
        </button>
        <button
          onClick={() => setShowMajors((v) => !v)}
          className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
        >
          <Search className="h-4 w-4" /> 自己选一个专业试试
        </button>
      </div>

      <AnimatePresence>
        {showMajors && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {MAJORS.map((m) => {
                const added = m.pathIds.every((id) => pinnedIds.includes(id) || list.some((l) => l.path.id === id));
                return (
                  <button
                    key={m.id}
                    onClick={() => m.pathIds.forEach(pin)}
                    className={cn("cursor-pointer rounded-xl border bg-white p-3 text-left text-sm transition-colors", added ? "border-neutral-900" : "border-neutral-200 hover:border-neutral-400")}
                  >
                    <p className="font-medium text-neutral-800">{m.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {m.duration}年制{m.requiredSubjects.length > 0 && ` · 需${m.requiredSubjects.join("+")}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Gate requireProfile>
      <Results />
    </Gate>
  );
}
