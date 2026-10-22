import { describe, expect, it } from "vitest";
import { estimateTier, rankToTier, scoreToRank } from "./tier";
import { orderToWeights } from "./metrics";
import { pickTop, rankPaths, scorePath } from "./matching";
import { resolvePath } from "./branch";
import { validatePath } from "./validate";
import { ALL_TAGS, MAJORS, PATHS, getMajor, getPath } from "./data";
import type { MetricKey } from "@/types";

const demoOrder: MetricKey[] = ["growth", "income", "freedom", "aiResilience", "stability", "workIntensity"];
const demoProfile = {
  preferenceTags: ["喜欢编程", "喜欢逻辑推理", "成长空间"],
  valueWeights: orderToWeights(demoOrder),
  subjects: ["物理", "化学", "生物"],
};

describe("tier", () => {
  it("按阈值映射层次", () => {
    expect(rankToTier("河南", 3000)).toBe("T1");
    expect(rankToTier("河南", 3001)).toBe("T2");
    expect(rankToTier("河南", 35000)).toBe("T3");
    expect(rankToTier("广东", 70000)).toBe("T4");
    expect(rankToTier("河南", 400000)).toBe("T5");
  });
  it("未覆盖省份使用默认阈值", () => {
    expect(rankToTier("四川", 16000)).toBe("T3");
  });
  it("分数越高位次越小", () => {
    expect(scoreToRank("河南", 650)).toBeLessThan(scoreToRank("河南", 600));
    expect(scoreToRank("河南", 700)).toBe(100);
  });
  it("跳过时按 T3 估算", () => {
    expect(estimateTier({ province: "河南", inputMode: "skip" })).toBe("T3");
  });
});

describe("matching", () => {
  it("权重归一化", () => {
    const w = orderToWeights(demoOrder);
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(w.growth).toBeCloseTo(6 / 21);
  });
  it("演示学生的第一推荐是后端开发", () => {
    const ranked = rankPaths(PATHS, MAJORS, demoProfile, "T3");
    expect(ranked[0].path.id).toBe("cs-backend");
    const top = pickTop(ranked);
    expect(top.length).toBeGreaterThanOrEqual(3);
    expect(top.length).toBeLessThanOrEqual(4);
  });
  it("选科不满足时有惩罚和警告", () => {
    const p = getPath("med-doctor")!;
    const ok = scorePath(p, getMajor("med"), { ...demoProfile, subjects: ["物理", "化学", "生物"] }, "T3");
    const bad = scorePath(p, getMajor("med"), { ...demoProfile, subjects: ["历史", "政治", "地理"] }, "T3");
    expect(bad.missingSubjects).toEqual(["物理", "化学"]);
    expect(bad.score).toBeCloseTo(ok.score * 0.7);
  });
  it("展示匹配度限制在 55-98", () => {
    const ranked = rankPaths(PATHS, MAJORS, { ...demoProfile, preferenceTags: [] }, "T5");
    ranked.forEach((r) => {
      expect(r.display).toBeGreaterThanOrEqual(55);
      expect(r.display).toBeLessThanOrEqual(98);
    });
  });
});

describe("branch", () => {
  const p = getPath("cs-backend")!;
  it("层次系数作用于薪资", () => {
    expect(resolvePath(p, "T1").stages[0].salary.p50).toBe(21500); // 16000*1.35=21600 → 21500
    expect(resolvePath(p, "T3").stages[2].salary.p50).toBe(35000);
  });
  it("分叉改变薪资、指标和描述", () => {
    const r = resolvePath(p, "T3", { "grad-choice": "civil" });
    expect(r.stages[2].salary.p50).toBe(23000); // 35000*0.65=22750 → 23000
    expect(r.metrics.stability).toBe(85);
    expect(r.metrics.workIntensity).toBe(50);
    expect(r.stages[0].typicalRoles[0]).toBe("国企信息部门工程师");
  });
  it("第3年分叉只影响之后的阶段", () => {
    const r = resolvePath(p, "T3", { "city-choice": "home" });
    expect(r.stages[0].salary.p50).toBe(16000);
    expect(r.stages[1].salary.p50).toBe(18000);
  });
  it("指标限制在0-100", () => {
    const r = resolvePath(getPath("law-court")!, "T3", { "career-choice": "leave", "grad-choice": "select" });
    Object.values(r.metrics).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });
});

describe("data", () => {
  it("16条路径全部通过结构校验", () => {
    expect(PATHS).toHaveLength(16);
    const errors = PATHS.flatMap(validatePath);
    expect(errors).toEqual([]);
  });
  it("所有路径标签都来自标签库，所有数据都标注 demo", () => {
    for (const p of PATHS) {
      p.tags.forEach((t) => expect(ALL_TAGS, `${p.id}: ${t}`).toContain(t));
      expect(p.university.source.confidence).toBe("demo");
      p.stages.forEach((s) => expect(s.salary.source.confidence).toBe("demo"));
    }
  });
  it("专业和路径互相对应", () => {
    for (const m of MAJORS) m.pathIds.forEach((id) => expect(getPath(id)?.majorId).toBe(m.id));
  });
});
