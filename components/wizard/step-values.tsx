"use client";

import { Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, Brain, Coins, GripVertical, Scale, Shield, Sprout, Wind } from "lucide-react";
import { useStore } from "@/lib/store";
import { METRIC_LABELS } from "@/lib/metrics";
import type { MetricKey } from "@/types";

const ICONS: Record<MetricKey, React.ComponentType<{ className?: string }>> = {
  income: Coins,
  stability: Shield,
  freedom: Wind,
  workIntensity: Scale,
  growth: Sprout,
  aiResilience: Brain,
};

const DESC: Record<MetricKey, string> = {
  income: "赚得多，经济上更宽裕",
  stability: "工作稳，不容易失业",
  freedom: "时间和工作方式更自主",
  workIntensity: "不太累，有自己的生活",
  growth: "能不断进步，天花板高",
  aiResilience: "未来不容易被AI取代",
};

function Item({ k, index, move }: { k: MetricKey; index: number; move: (from: number, to: number) => void }) {
  const controls = useDragControls();
  const Icon = ICONS[k];
  return (
    <Reorder.Item value={k} dragListener={false} dragControls={controls} className="list-none">
      <div className="flex select-none items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
        <span className="w-5 text-center text-sm font-semibold tabular-nums text-neutral-400">{index + 1}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-900">{METRIC_LABELS[k]}</p>
          <p className="text-xs text-neutral-500">{DESC[k]}</p>
        </div>
        <div className="flex flex-col">
          <button aria-label="上移" disabled={index === 0} onClick={() => move(index, index - 1)} className="cursor-pointer px-1.5 py-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button aria-label="下移" disabled={index === 5} onClick={() => move(index, index + 1)} className="cursor-pointer px-1.5 py-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <span onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none p-1 text-neutral-300 active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </span>
      </div>
    </Reorder.Item>
  );
}

export function StepValues() {
  const order = useStore((s) => s.valueOrder);
  const setOrder = useStore((s) => s.setValueOrder);
  const move = (from: number, to: number) => {
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setOrder(next);
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">你最在乎什么</h1>
      <p className="mb-8 text-sm text-neutral-500">拖动排序，最在乎的放最上面</p>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2.5">
        {order.map((k, i) => (
          <Item key={k} k={k} index={i} move={move} />
        ))}
      </Reorder.Group>
    </div>
  );
}
