import type { BranchNode, CareerPath, ChapterId, LifeEvent, UserProfile } from "@/types";
import type { ResolvedPath } from "./branch";
import { branchYear, formatSalary } from "./branch";
import { getMajor, tierName } from "./data";

const MAJOR_CODE: Record<string, string> = { cs: "CS", med: "MD", fin: "FN", law: "LW", chn: "CN", ee: "EE", psy: "PS", vet: "VT" };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** UNIVERSE #CS-0427：专业缩写 + 由路径 id 哈希得到的固定4位数 */
export function universeId(path: Pick<CareerPath, "id" | "majorId">): string {
  return `UNIVERSE #${MAJOR_CODE[path.majorId] ?? "XX"}-${String(hash(path.id) % 10000).padStart(4, "0")}`;
}

export const CHAPTERS: { id: ChapterId; label: string; stage?: LifeEvent["stage"]; branchYear?: number; stageIndex: number }[] = [
  { id: "prologue", label: "序章", stageIndex: 0 },
  { id: "y1", label: "大一", stageIndex: 0 },
  { id: "y3", label: "大三", stage: "university", stageIndex: 0 },
  { id: "grad", label: "毕业", stage: "graduation", branchYear: 0, stageIndex: 0 },
  { id: "w3", label: "第3年", stage: "year3", branchYear: 3, stageIndex: 0 },
  { id: "w5", label: "第5年", stage: "year5", stageIndex: 1 },
  { id: "w10", label: "第10年", stage: "year10", stageIndex: 2 },
  { id: "epilogue", label: "尾声", stageIndex: 2 },
];

const CURRENT_AGE: Record<UserProfile["grade"], number> = { 高一: 16, 高二: 17, 高三: 18 };

/** 年份 = 当前年份 + 偏移；年龄按年级推算（高一16岁，高二17岁，高三18岁） */
export function chapterTime(chapter: ChapterId, grade: UserProfile["grade"], duration: number, now = new Date().getFullYear()) {
  const gaokao = now + (18 - CURRENT_AGE[grade]);
  const grad = gaokao + duration;
  const year: Record<ChapterId, number> = { prologue: gaokao, y1: gaokao, y3: gaokao + 2, grad, w3: grad + 3, w5: grad + 5, w10: grad + 10, epilogue: grad + 10 };
  const y = year[chapter];
  return { year: y, age: CURRENT_AGE[grade] + (y - now) };
}

export function branchesForChapter(path: CareerPath, chapter: ChapterId): BranchNode[] {
  const c = CHAPTERS.find((x) => x.id === chapter);
  if (c?.branchYear === undefined) return [];
  return path.branches.filter((b) => branchYear(b.atStage) === c.branchYear);
}

/** 读取 "stages[0].salary.p50" 这类数据引用 */
export function resolveRef(obj: unknown, ref: string): unknown {
  return ref
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

export type StoryContext = {
  year: number;
  age: number;
  province: string;
  city: string;
  role: string;
  endingRole?: string;
  universe: string;
};

/** 模板占位符：{year} {age} {province} {major} {title} {city} {role} {school} {ending_role} {universe}，{$引用} 为金额 */
export function fillTemplate(template: string, path: ResolvedPath, ctx: StoryContext): string {
  const major = getMajor(path.majorId)?.name ?? "";
  const vars: Record<string, string> = {
    year: String(ctx.year),
    age: String(ctx.age),
    province: ctx.province,
    major,
    title: path.title,
    city: ctx.city,
    role: ctx.role,
    school: tierName(path.tier),
    ending_role: ctx.endingRole ?? ctx.role,
    universe: ctx.universe,
  };
  return template.replace(/\{(\$?)([^{}]+)\}/g, (m, money: string, key: string) => {
    if (money) {
      const v = resolveRef(path, key);
      return typeof v === "number" ? formatSalary(v) : m;
    }
    return vars[key] ?? m;
  });
}

export function chapterContext(path: ResolvedPath, chapter: ChapterId, profile: Pick<UserProfile, "grade" | "province">, endingRole?: string): StoryContext {
  const c = CHAPTERS.find((x) => x.id === chapter)!;
  const stage = path.stages[c.stageIndex];
  const { year, age } = chapterTime(chapter, profile.grade, getMajor(path.majorId)?.duration ?? 4);
  return { year, age, province: profile.province, city: stage.cities[0], role: stage.typicalRoles[0], endingRole, universe: universeId(path) };
}
