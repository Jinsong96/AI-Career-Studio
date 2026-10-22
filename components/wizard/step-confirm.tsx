"use client";

import { Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { useEstimatedRank, useTier } from "@/lib/hooks";
import { tierName } from "@/lib/data";
import { METRIC_LABELS } from "@/lib/metrics";
import { isCoveredProvince } from "@/lib/tier";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierDisclaimer } from "@/components/common/disclaimer";

function Row({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 py-3 last:border-0">
      <span className="w-16 shrink-0 text-sm text-neutral-400">{label}</span>
      <div className="flex-1 text-sm text-neutral-800">{children}</div>
      <button onClick={onEdit} className="text-neutral-300 hover:text-brand" aria-label={`修改${label}`}>
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function StepConfirm({ onEdit }: { onEdit: (step: number) => void }) {
  const profile = useStore((s) => s.profile);
  const order = useStore((s) => s.valueOrder);
  const tier = useTier();
  const rank = useEstimatedRank();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">确认</h1>

      <Card className="px-4">
        <Row label="基础" onEdit={() => onEdit(0)}>
          {profile.grade} · {profile.province}
          {!isCoveredProvince(profile.province) && <span className="text-xs text-neutral-400">（估算）</span>}
          <br />
          {profile.inputMode === "rank" && `位次 ${profile.rank?.toLocaleString()}`}
          {profile.inputMode === "score" && `分数 ${profile.score}（估算位次约 ${rank?.toLocaleString()}）`}
          {profile.inputMode === "skip" && "暂未填写成绩"}
        </Row>
        <Row label="选科" onEdit={() => onEdit(0)}>
          {profile.subjects.join(" + ")}
        </Row>
        <Row label="兴趣" onEdit={() => onEdit(1)}>
          <div className="flex flex-wrap gap-1.5">
            {profile.preferenceTags.map((t) => (
              <Badge key={t} variant="gray">{t}</Badge>
            ))}
          </div>
        </Row>
        <Row label="在乎" onEdit={() => onEdit(2)}>
          {order.map((k, i) => (
            <span key={k} className="mr-2 inline-block">
              <span className="tabular-nums text-neutral-400">{i + 1}</span> {METRIC_LABELS[k]}
            </span>
          ))}
        </Row>
      </Card>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">预估院校层次</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900">
          {tierName(tier)}（{tier}）
        </p>
        <TierDisclaimer className="mt-2" />
      </div>
    </div>
  );
}
