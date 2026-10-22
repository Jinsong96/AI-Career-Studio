import { describe, expect, it } from "vitest";
import { PATHS, getPath } from "./data";
import { resolvePath } from "./branch";
import { endingOf, mulberry32, salaryAtPercentile, simulate, simulateMany, topEventInsight } from "./simulate";
import { chapterTime, fillTemplate, chapterContext, universeId } from "./story";

const cs = getPath("cs-backend")!;

describe("simulate", () => {
  it("同一个种子结果相同", () => {
    const a = simulate(cs, "T3", { "grad-choice": "work" }, 427);
    const b = simulate(cs, "T3", { "grad-choice": "work" }, 427);
    expect(a).toEqual(b);
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });

  it("1000次运行的中位数接近 p50（全部16条路径）", () => {
    for (const p of PATHS) {
      const runs = simulateMany(p, "T3", {}, 1000, 11);
      const sal = runs.map((r) => r.year10Salary).sort((x, y) => x - y);
      const p50 = resolvePath(p, "T3").stages[2].salary.p50;
      expect(Math.abs(sal[500] / p50 - 1), p.id).toBeLessThan(0.1);
    }
  });

  it("百分位限制在1-99，每阶段最多触发2个事件", () => {
    for (const r of simulateMany(cs, "T1", {}, 500, 5)) {
      expect(r.percentile).toBeGreaterThanOrEqual(1);
      expect(r.percentile).toBeLessThanOrEqual(99);
      const per = new Map<string, number>();
      r.triggered.forEach((e) => per.set(e.stage, (per.get(e.stage) ?? 0) + 1));
      per.forEach((n) => expect(n).toBeLessThanOrEqual(2));
    }
  });

  it("结局归类和薪资插值", () => {
    expect(endingOf(80)).toBe("ideal");
    expect(endingOf(79)).toBe("typical");
    expect(endingOf(19)).toBe("worst");
    const s = { p10: 10000, p50: 20000, p90: 40000 };
    expect(salaryAtPercentile(50, s)).toBe(20000);
    expect(salaryAtPercentile(10, s)).toBe(10000);
    expect(salaryAtPercentile(70, s)).toBe(30000);
    expect(salaryAtPercentile(1, s)).toBeGreaterThanOrEqual(5000);
    expect(salaryAtPercentile(99, s)).toBeLessThanOrEqual(52000);
  });

  it("分叉的薪资乘数作用于模拟结果", () => {
    const base = simulate(cs, "T3", {}, 9);
    const civil = simulate(cs, "T3", { "grad-choice": "civil" }, 9);
    expect(civil.percentile).toBe(base.percentile);
    expect(civil.year10Salary).toBeLessThan(base.year10Salary);
  });

  it("能找出影响最大的事件", () => {
    const ins = topEventInsight(simulateMany(cs, "T3", {}, 1000, 2));
    expect(ins).not.toBeNull();
    expect(ins!.ratio).toBeGreaterThan(1);
  });
});

describe("story", () => {
  it("宇宙编号固定", () => {
    expect(universeId(cs)).toMatch(/^UNIVERSE #CS-\d{4}$/);
    expect(universeId(cs)).toBe(universeId(cs));
  });
  it("年份和年龄", () => {
    expect(chapterTime("prologue", "高三", 4, 2026)).toEqual({ year: 2026, age: 18 });
    expect(chapterTime("prologue", "高一", 4, 2026)).toEqual({ year: 2028, age: 18 });
    expect(chapterTime("w10", "高三", 4, 2026)).toEqual({ year: 2040, age: 32 });
  });
  it("模板只填入数据里的数字", () => {
    const r = resolvePath(cs, "T3");
    const text = fillTemplate(cs.storyChapters.find((c) => c.chapter === "w3")!.template, r, chapterContext(r, "w3", { grade: "高三", province: "河南" }));
    expect(text).toContain("1.6万");
    expect(text).not.toMatch(/\{/);
  });
});
