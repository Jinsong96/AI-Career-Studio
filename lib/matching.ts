import type { CareerPath, Major, MetricKey, SchoolTier, UserProfile } from "@/types";
import { METRIC_KEYS, METRIC_LABELS, displayScore, weightsToOrder } from "./metrics";

export type MatchResult = {
  path: CareerPath;
  score: number; // 0-1 原始总分
  display: number; // 55-98 的展示百分比
  tagScore: number;
  valueScore: number;
  tierScore: number;
  missingSubjects: string[];
  hitTags: string[];
  reasons: string[];
};

export function missingSubjects(major: Major | undefined, subjects: string[]): string[] {
  if (!major) return [];
  return major.requiredSubjects.filter((s) => !subjects.includes(s));
}

export function scorePath(
  path: CareerPath,
  major: Major | undefined,
  profile: Pick<UserProfile, "preferenceTags" | "valueWeights" | "subjects">,
  tier: SchoolTier,
): MatchResult {
  const userTags = profile.preferenceTags;
  const hitTags = path.tags.filter((t) => userTags.includes(t));
  const tagScore = hitTags.length / Math.max(userTags.length, 1);

  let valueScore = 0;
  for (const k of METRIC_KEYS) valueScore += (profile.valueWeights[k] ?? 0) * (displayScore(path.metrics, k) / 100);

  const tierScore = path.tierFit.includes(tier) ? 1 : 0.5;
  const missing = missingSubjects(major, profile.subjects);
  const penalty = missing.length > 0 ? 0.7 : 1;

  const score = (0.45 * tagScore + 0.4 * valueScore + 0.15 * tierScore) * penalty;
  const display = Math.min(98, Math.max(55, Math.round(score * 100)));

  return {
    path,
    score,
    display,
    tagScore,
    valueScore,
    tierScore,
    missingSubjects: missing,
    hitTags,
    reasons: buildReasons(path, hitTags, profile.valueWeights, tierScore === 1),
  };
}

function buildReasons(path: CareerPath, hitTags: string[], weights: Record<MetricKey, number>, tierFits: boolean): string[] {
  const reasons: string[] = [];
  if (hitTags.length > 0) reasons.push(`匹配你的${hitTags.slice(0, 2).map((t) => `“${t}”`).join("和")}`);

  // 在用户最在乎的前3个维度里，找这条路径得分最高的那个
  const top = weightsToOrder(weights).slice(0, 3);
  const best = top
    .map((k) => ({ k, v: displayScore(path.metrics, k) }))
    .sort((a, b) => b.v - a.v)[0];
  if (best && best.v >= 60) {
    const rankWord = top[0] === best.k ? "最在乎" : "在乎";
    reasons.push(`你${rankWord}的“${METRIC_LABELS[best.k]}”得分高（${best.v}分）`);
  }
  if (reasons.length === 0 && tierFits) reasons.push("和你的预估院校层次匹配度高");
  if (reasons.length === 0) reasons.push("和你的偏好有一定差异，可以作为对照看看");
  return reasons.slice(0, 2);
}

export function rankPaths(
  paths: CareerPath[],
  majors: Major[],
  profile: Pick<UserProfile, "preferenceTags" | "valueWeights" | "subjects">,
  tier: SchoolTier,
): MatchResult[] {
  const majorMap = new Map(majors.map((m) => [m.id, m]));
  return paths
    .map((p) => scorePath(p, majorMap.get(p.majorId), profile, tier))
    .sort((a, b) => b.score - a.score);
}

/** 取前3条（第4条与第3条差距小于5分时展示4条），同一专业最多2条 */
export function pickTop(ranked: MatchResult[]): MatchResult[] {
  const perMajor = new Map<string, number>();
  const eligible = ranked.filter((r) => {
    const n = perMajor.get(r.path.majorId) ?? 0;
    if (n >= 2) return false;
    perMajor.set(r.path.majorId, n + 1);
    return true;
  });
  const top = eligible.slice(0, 3);
  const fourth = eligible[3];
  if (fourth && top[2] && (top[2].score - fourth.score) * 100 < 5) top.push(fourth);
  return top;
}

/** "换一组"：排名第5到8的路径 */
export function pickAlternatives(ranked: MatchResult[]): MatchResult[] {
  return ranked.slice(4, 8);
}
