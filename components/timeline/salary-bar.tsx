import type { SalaryRange } from "@/types";
import { formatSalary } from "@/lib/branch";

/** p10 / p50 / p90 区间条；scaleMax 让不同阶段在同一尺度上对比 */
export function SalaryBar({ salary, scaleMax }: { salary: SalaryRange; scaleMax: number }) {
  const pct = (n: number) => `${Math.min(100, (n / scaleMax) * 100)}%`;
  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-neutral-100">
        <div className="absolute h-full rounded-full bg-brand-200" style={{ left: pct(salary.p10), width: `calc(${pct(salary.p90)} - ${pct(salary.p10)})` }} />
        <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand" style={{ left: pct(salary.p50) }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-neutral-500">
        <span>后10%：¥{formatSalary(salary.p10)}</span>
        <span className="font-semibold text-brand">中位数 ¥{formatSalary(salary.p50)}</span>
        <span>前10%：¥{formatSalary(salary.p90)}</span>
      </div>
    </div>
  );
}
