import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-neutral-500", className)}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
      以上为同类人群的统计分布，不代表对你个人的预测。
    </p>
  );
}

export function TierDisclaimer({ className }: { className?: string }) {
  return <p className={cn("text-xs text-neutral-400", className)}>Demo 使用简化估算，不是真实录取数据</p>;
}
