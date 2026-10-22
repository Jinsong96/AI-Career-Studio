import type { CareerPath, SchoolTier } from "@/types";
import { resolveRef } from "./story";

const TIERS: SchoolTier[] = ["T1", "T2", "T3", "T4", "T5"];
const METRICS = ["income", "stability", "freedom", "workIntensity", "growth", "aiResilience"];
const MOODS = ["focus", "social", "tired", "happy", "stress"];
const CONFIDENCE = ["high", "medium", "low", "demo"];

/** 运行时校验：确保 JSON 数据和 CareerPath 类型一致，返回错误列表 */
export function validatePath(p: CareerPath): string[] {
  const errs: string[] = [];
  const req = (cond: unknown, msg: string) => {
    if (!cond) errs.push(`${p.id ?? "?"}: ${msg}`);
  };
  const src = (s: unknown, where: string) => {
    const o = s as { name?: unknown; year?: unknown; confidence?: unknown } | undefined;
    req(o && typeof o.name === "string" && typeof o.year === "number" && CONFIDENCE.includes(o.confidence as string), `${where}.source 不合法`);
  };
  const strArr = (a: unknown, where: string) => req(Array.isArray(a) && a.every((x) => typeof x === "string"), `${where} 应为字符串数组`);

  req(typeof p.id === "string" && typeof p.majorId === "string", "id/majorId");
  req(typeof p.title === "string" && typeof p.tagline === "string", "title/tagline");
  strArr(p.tags, "tags");
  req(Array.isArray(p.tierFit) && p.tierFit.every((t) => TIERS.includes(t)), "tierFit");
  req(TIERS.every((t) => typeof p.tierNotes?.[t] === "string"), "tierNotes 需覆盖 T1-T5");

  const u = p.university;
  strArr(u?.coreCourses, "coreCourses");
  strArr(u?.hardestCourses, "hardestCourses");
  req([1, 2, 3, 4, 5].includes(u?.pressureLevel), "pressureLevel");
  req(typeof u?.postgradRate === "string" && typeof u?.abroadRate === "string" && typeof u?.switchMajorDifficulty === "string", "university 文本字段");
  req(Array.isArray(u?.yearByYear) && u.yearByYear.every((y) => typeof y.year === "number" && typeof y.description === "string"), "yearByYear");
  src(u?.source, "university");

  req(Array.isArray(p.graduation?.destinations) && p.graduation.destinations.every((d) => typeof d.label === "string" && typeof d.percent === "number"), "destinations");
  src(p.graduation?.source, "graduation");

  req(Array.isArray(p.stages) && p.stages.length === 3, "stages 应为3个");
  p.stages?.forEach((s, i) => {
    req(typeof s.label === "string" && typeof s.yearsAfterGrad === "number" && typeof s.lifeDescription === "string", `stages[${i}]`);
    strArr(s.typicalRoles, `stages[${i}].typicalRoles`);
    strArr(s.cities, `stages[${i}].cities`);
    req(s.salary && s.salary.p10 <= s.salary.p50 && s.salary.p50 <= s.salary.p90, `stages[${i}].salary 应满足 p10<=p50<=p90`);
    src(s.salary?.source, `stages[${i}].salary`);
  });

  const types = (p.scenarios ?? []).map((s) => s.type).sort().join(",");
  req(types === "ideal,typical,worst", "scenarios 需包含 ideal/typical/worst");
  p.scenarios?.forEach((s) => {
    req(typeof s.year10Salary === "number" && typeof s.role === "string" && typeof s.lifeQuality === "string" && typeof s.percentileLabel === "string", `scenario ${s.type}`);
    strArr(s.howPeopleGetHere, `scenario ${s.type}.howPeopleGetHere`);
    if (s.type === "worst") req(Array.isArray(s.pivotOptions) && s.pivotOptions.length > 0, "worst 必须有 pivotOptions");
  });

  const d = p.dayInLife;
  req(typeof d?.persona === "string" && typeof d?.bestPart === "string" && typeof d?.hardestPart === "string", "dayInLife 文本");
  req(Array.isArray(d?.schedule) && d.schedule.every((s) => /^\d{2}:\d{2}$/.test(s.time) && typeof s.activity === "string" && (!s.mood || MOODS.includes(s.mood))), "schedule");
  src(d?.source, "dayInLife");

  strArr(p.aiRisk?.replaceableTasks, "aiRisk.replaceableTasks");
  strArr(p.aiRisk?.resilientTasks, "aiRisk.resilientTasks");
  strArr(p.aiRisk?.skillsToBuild, "aiRisk.skillsToBuild");
  req(typeof p.aiRisk?.summary === "string", "aiRisk.summary");

  req(METRICS.every((k) => typeof (p.metrics as Record<string, number>)?.[k] === "number"), "metrics");

  req(Array.isArray(p.branches) && p.branches.length >= 2, "branches 至少2个");
  p.branches?.forEach((b) => {
    req(typeof b.id === "string" && typeof b.atStage === "string" && typeof b.question === "string", `branch ${b.id}`);
    req(Array.isArray(b.options) && b.options.length >= 2, `branch ${b.id} 至少2个选项`);
    b.options?.forEach((o) => {
      req(typeof o.salaryMultiplier === "number" && typeof o.tradeoff === "string" && typeof o.label === "string", `option ${b.id}.${o.id}`);
      req(Object.keys(o.metricsDelta ?? {}).every((k) => METRICS.includes(k)), `option ${b.id}.${o.id} metricsDelta`);
    });
  });

  strArr(p.highSchoolPrep, "highSchoolPrep");

  const STAGES = ["university", "graduation", "year3", "year5", "year10"];
  const CHAPTER_IDS = ["prologue", "y1", "y3", "grad", "w3", "w5", "w10", "epilogue"];
  req(Array.isArray(p.events) && p.events.length >= 8 && p.events.length <= 12, "events 应为8到12个");
  const challenges = (p.events ?? []).filter((e) => e.tone === "challenge");
  req(challenges.length <= Math.floor((p.events?.length ?? 0) / 3), "challenge 类事件不超过1/3");
  STAGES.forEach((st) => req(p.events?.some((e) => e.stage === st), `events 缺少阶段 ${st}`));
  p.events?.forEach((e) => {
    req(STAGES.includes(e.stage) && e.probability > 0 && e.probability <= 1 && typeof e.percentileShift === "number", `event ${e.id}`);
    req(["positive", "neutral", "challenge"].includes(e.tone), `event ${e.id}.tone`);
    if (e.tone === "challenge") req(typeof e.copingTip === "string" && e.copingTip.length > 0, `challenge 事件 ${e.id} 必须有 copingTip`);
    src(e.source, `event ${e.id}`);
  });
  req(Array.isArray(p.storyChapters) && CHAPTER_IDS.every((c) => p.storyChapters.some((s) => s.chapter === c)), "storyChapters 需覆盖全部章节");
  req(Array.isArray(p.artifacts) && p.artifacts.every((a) => CHAPTER_IDS.includes(a.chapter) && ["moments", "chat", "payslip", "calendar", "offer"].includes(a.type)), "artifacts");
  p.artifacts?.forEach((a) => {
    // 工资条等数字字段只能是数据引用，渲染时读取
    Object.entries(a.data).forEach(([k, v]) => {
      if (k.endsWith("Ref")) req(typeof v === "string" && typeof resolveRef(p, v) === "number", `artifact ${a.type}.${k} 引用无效`);
      else req(typeof v !== "number", `artifact ${a.type}.${k} 不能直接写数字`);
    });
  });
  const refs = [...(p.storyChapters ?? []).map((c) => c.template), ...Object.values(p.futureSelfFAQ ?? {})].flatMap((t) => Array.from(t.matchAll(/\{\$([^}]+)\}/g)).map((m) => m[1]));
  refs.forEach((r) => req(typeof resolveRef(p, r) === "number", `模板引用 ${r} 无效`));
  req(["regret", "tired", "college", "again", "life"].every((k) => typeof p.futureSelfFAQ?.[k as keyof typeof p.futureSelfFAQ] === "string"), "futureSelfFAQ 需覆盖5个预设问题");
  req(typeof p.reunionLine === "string", "reunionLine");
  return errs;
}
