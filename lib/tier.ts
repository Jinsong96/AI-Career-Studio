import type { SchoolTier, UserProfile } from "@/types";
import provinceJson from "@/data/province-rank-map.json";
import tiersJson from "@/data/school-tiers.json";

type Thresholds = { T1: number; T2: number; T3: number; T4: number };
type ScoreRule = { maxScore: number; topScore: number; totalCandidates: number };

const thresholds = provinceJson.thresholds as Record<string, Thresholds>;
const scoreRules = provinceJson.scoreToRank as Record<string, ScoreRule>;

export function isCoveredProvince(province: string): boolean {
  return provinceJson.covered.includes(province);
}

export function getThresholds(province: string): Thresholds {
  return thresholds[province] ?? thresholds.default;
}

export function rankToTier(province: string, rank: number): SchoolTier {
  const t = getThresholds(province);
  if (rank <= t.T1) return "T1";
  if (rank <= t.T2) return "T2";
  if (rank <= t.T3) return "T3";
  if (rank <= t.T4) return "T4";
  return "T5";
}

/** 简化线性换算：topScore 对应约前 100 名，每低 1 分位次线性增加（仅为 Demo 估算） */
export function scoreToRank(province: string, score: number): number {
  const r = scoreRules[province] ?? scoreRules.default;
  const floor = 300;
  if (score >= r.topScore) return 100;
  const ratio = (r.topScore - Math.max(score, floor)) / (r.topScore - floor);
  return Math.max(100, Math.round(ratio * r.totalCandidates * 0.6));
}

export function estimateRank(profile: Pick<UserProfile, "province" | "inputMode" | "rank" | "score">): number | undefined {
  if (profile.inputMode === "rank" && profile.rank) return profile.rank;
  if (profile.inputMode === "score" && profile.score) return scoreToRank(profile.province, profile.score);
  return undefined;
}

/** 暂时跳过分数时，按 T3 估算 */
export function estimateTier(profile: Pick<UserProfile, "province" | "inputMode" | "rank" | "score">): SchoolTier {
  const rank = estimateRank(profile);
  return rank === undefined ? "T3" : rankToTier(profile.province, rank);
}

export function salaryFactor(tier: SchoolTier): number {
  return tiersJson.tiers.find((t) => t.tier === tier)?.salaryFactor ?? 1;
}
