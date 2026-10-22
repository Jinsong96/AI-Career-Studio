import type { BranchOption, CareerPath, LifeMetrics, Scenario, SchoolTier, Stage } from "@/types";
import { applyMetricsDelta } from "./metrics";
import { salaryFactor } from "./tier";

export type ResolvedPath = CareerPath & {
  /** 应用层次系数和分叉后的阶段、情况和指标 */
  stages: Stage[];
  scenarios: Scenario[];
  metrics: LifeMetrics;
  baseMetrics: LifeMetrics;
  tier: SchoolTier;
  chosen: { nodeId: string; option: BranchOption }[];
};

/** "毕业时" → 0，"工作第3年" → 3；分叉只影响此后的阶段 */
export function branchYear(atStage: string): number {
  const m = atStage.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

function roundSalary(n: number): number {
  return Math.round(n / 500) * 500;
}

export function resolvePath(path: CareerPath, tier: SchoolTier, choices: Record<string, string> = {}): ResolvedPath {
  const factor = salaryFactor(tier);
  const chosen = path.branches
    .map((node) => {
      const option = node.options.find((o) => o.id === choices[node.id]);
      return option ? { nodeId: node.id, option, year: branchYear(node.atStage) } : null;
    })
    .filter((x): x is { nodeId: string; option: BranchOption; year: number } => x !== null);

  const stages = path.stages.map((stage) => {
    let mult = factor;
    let s: Stage = { ...stage };
    for (const c of chosen) {
      const affects = c.year === 0 ? true : stage.yearsAfterGrad > c.year;
      if (!affects) continue;
      mult *= c.option.salaryMultiplier;
      const override = c.option.stageOverrides?.find((o) => o.yearsAfterGrad === stage.yearsAfterGrad);
      if (override) s = { ...s, ...override, salary: s.salary, label: s.label };
    }
    return {
      ...s,
      salary: {
        ...stage.salary,
        p10: roundSalary(stage.salary.p10 * mult),
        p50: roundSalary(stage.salary.p50 * mult),
        p90: roundSalary(stage.salary.p90 * mult),
      },
    };
  });

  const year10Mult = chosen.reduce((m, c) => m * c.option.salaryMultiplier, factor);
  const scenarios = path.scenarios.map((sc) => ({ ...sc, year10Salary: roundSalary(sc.year10Salary * year10Mult) }));

  const metrics = chosen.reduce((m, c) => applyMetricsDelta(m, c.option.metricsDelta), path.metrics);

  return {
    ...path,
    stages,
    scenarios,
    metrics,
    baseMetrics: path.metrics,
    tier,
    chosen: chosen.map(({ nodeId, option }) => ({ nodeId, option })),
  };
}

export function typicalYear10(resolved: ResolvedPath): number {
  return resolved.scenarios.find((s) => s.type === "typical")?.year10Salary ?? 0;
}

export function formatSalary(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万` : `${n.toLocaleString("zh-CN")}`;
}
