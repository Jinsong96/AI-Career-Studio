import type { ResolvedPath } from "./branch";
import { formatSalary } from "./branch";

/** 降级方案：没有 API Key 时，用数据拼出约150字的第二人称叙述（只使用数据中的数字） */
export function templateNarrative(p: ResolvedPath): string {
  const y10 = p.stages.find((s) => s.yearsAfterGrad === 10) ?? p.stages[p.stages.length - 1];
  const city = y10.cities[0];
  const role = y10.typicalRoles[0];
  const sched = p.dayInLife.schedule;
  const first = sched[0];
  const mid = sched[Math.floor(sched.length / 2)];
  const last = sched[sched.length - 1];
  const choiceText = p.chosen.length > 0 ? `当年你选择了「${p.chosen.map((c) => c.option.label).join("」，后来又「")}」。` : "";
  const typical = p.scenarios.find((s) => s.type === "typical");

  return (
    `十年后的你，可能在${city}做${role}。${choiceText}` +
    `早上${first.time}，你${first.activity}；${mid.time}，你${mid.activity}；到了${last.time}，${last.activity}。` +
    `走这条路的人，第10年月薪中位数约${formatSalary(typical?.year10Salary ?? y10.salary.p50)}元。`
  );
}
