import type { Source } from "@/types";
import { formatSalary } from "@/lib/branch";
import { SourceTag } from "@/components/common/source-tag";

export type PayslipData = { company: string; period: string; gross: number; low: number; high: number; source: Source };

/** 数字全部来自路径数据（已按院校层次和分叉调整），不做额外推算 */
export function Payslip({ data }: { data: PayslipData }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[14px] bg-[#FFFDF7] p-5 font-mono text-[#222] shadow-[0_0_40px_rgba(96,112,242,0.18)]">
      <div className="flex items-baseline justify-between border-b border-dashed border-[#cfc6ad] pb-2">
        <p className="font-sans text-[15px] font-semibold">{data.company}</p>
        <p className="text-[11px] text-[#8a8270]">工资条</p>
      </div>
      <p className="mt-2 text-[11px] text-[#8a8270]">{data.period}</p>
      <div className="mt-3 space-y-1.5 text-[13px]">
        <div className="flex justify-between">
          <span className="font-sans">应发月薪（税前，同岗位中位数）</span>
          <span className="font-semibold">¥{data.gross.toLocaleString("zh-CN")}</span>
        </div>
        <div className="flex justify-between text-[#8a8270]">
          <span className="font-sans">同岗位区间（后10% / 前10%）</span>
          <span>
            {formatSalary(data.low)} – {formatSalary(data.high)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#cfc6ad] pt-2 font-sans">
        <span className="text-[11px] text-[#8a8270]">示例数据</span>
        <span className="[&_button]:text-[#8a8270]">
          <SourceTag source={data.source} extra="已根据院校层次和分叉选择调整" />
        </span>
      </div>
    </div>
  );
}
