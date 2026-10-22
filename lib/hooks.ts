"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "./store";
import { estimateRank, estimateTier } from "./tier";
import { MAJORS, PATHS, getPath } from "./data";
import { pickAlternatives, pickTop, rankPaths } from "./matching";
import { resolvePath } from "./branch";
import { runLabel, simulate } from "./simulate";

/** localStorage 中的状态只在客户端可用，挂载前渲染占位，避免水合不一致 */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

export function useTier() {
  const profile = useStore((s) => s.profile);
  return useMemo(() => estimateTier(profile), [profile]);
}

export function useEstimatedRank() {
  const profile = useStore((s) => s.profile);
  return useMemo(() => estimateRank(profile), [profile]);
}

export function useRanking() {
  const profile = useStore((s) => s.profile);
  const tier = useTier();
  return useMemo(() => {
    const ranked = rankPaths(PATHS, MAJORS, profile, tier);
    return { ranked, top: pickTop(ranked), alternatives: pickAlternatives(ranked) };
  }, [profile, tier]);
}

export function useResolvedPath(id: string) {
  const tier = useTier();
  const choices = useStore((s) => s.branchChoices[id]);
  return useMemo(() => {
    const p = getPath(id);
    return p ? resolvePath(p, tier, choices ?? {}) : undefined;
  }, [id, tier, choices]);
}

/** 当前这一次人生：种子来自 store，分叉选择会影响薪资，不影响已经抽到的事件 */
export function useSimulation(id: string) {
  const tier = useTier();
  const choices = useStore((s) => s.branchChoices[id]);
  const seed = useStore((s) => s.seeds[id]);
  const runs = useStore((s) => s.runs[id]);
  const ensureSeed = useStore((s) => s.ensureSeed);
  useEffect(() => {
    if (getPath(id)) ensureSeed(id);
  }, [id, ensureSeed]);
  return useMemo(() => {
    const p = getPath(id);
    if (!p || seed === undefined) return undefined;
    const sim = simulate(p, tier, choices ?? {}, seed);
    const list = runs ?? [];
    const idx = list.findIndex((r) => r.seed === seed);
    return { sim, label: runLabel(seed, idx >= 0 ? idx + 1 : list.length + 1), history: list };
  }, [id, tier, choices, seed, runs]);
}

/** 是否接入了大模型（服务端有 Key） */
export function useLlmAvailable() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { llm: boolean }) => setOk(d.llm))
      .catch(() => setOk(false));
  }, []);
  return ok;
}
