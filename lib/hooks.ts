"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "./store";
import { estimateRank, estimateTier } from "./tier";
import { MAJORS, PATHS, getPath } from "./data";
import { pickAlternatives, pickTop, rankPaths } from "./matching";
import { resolvePath } from "./branch";

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
