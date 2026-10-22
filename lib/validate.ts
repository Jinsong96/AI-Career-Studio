import type { CareerPath, SchoolTier } from "@/types";

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
  return errs;
}
