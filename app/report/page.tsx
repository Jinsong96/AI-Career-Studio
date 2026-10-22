"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarCheck, CheckCircle2, ClipboardCheck, Lock, Printer, Unlock, X } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { StatDisclaimer, TierDisclaimer } from "@/components/common/disclaimer";
import { SourceTag } from "@/components/common/source-tag";
import { Card, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_PROFILE, useStore } from "@/lib/store";
import { MAJORS, PATHS, getMajor, tierName } from "@/lib/data";
import { estimateRank, estimateTier } from "@/lib/tier";
import { missingSubjects, pickTop, rankPaths } from "@/lib/matching";
import { formatSalary, resolvePath, typicalYear10 } from "@/lib/branch";
import { METRIC_LABELS, weightsToOrder } from "@/lib/metrics";
import type { SchoolTier } from "@/types";
import { cn } from "@/lib/utils";

const TIER_ORDER: SchoolTier[] = ["T1", "T2", "T3", "T4", "T5"];

function shiftTier(t: SchoolTier, d: number): SchoolTier {
  return TIER_ORDER[Math.min(4, Math.max(0, TIER_ORDER.indexOf(t) + d))];
}

function ReportView() {
  const hasProfile = useStore((s) => s.hasProfile);
  const storeProfile = useStore((s) => s.profile);
  const branchChoices = useStore((s) => s.branchChoices);
  const unlocked = useStore((s) => s.reportUnlocked);
  const unlock = useStore((s) => s.unlockReport);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");

  const isSample = !hasProfile;
  const profile = isSample ? DEMO_PROFILE : storeProfile;
  const tier = estimateTier(profile);
  const rank = estimateRank(profile);

  const { ranked, top } = useMemo(() => {
    const r = rankPaths(PATHS, MAJORS, profile, tier);
    return { ranked: r, top: pickTop(r) };
  }, [profile, tier]);
  const resolved = top.map((m) => resolvePath(m.path, tier, isSample ? {} : branchChoices[m.path.id] ?? {}));
  const backups = ranked.filter((r) => !top.includes(r) && r.missingSubjects.length === 0).slice(0, 2);
  const order = weightsToOrder(profile.valueWeights);

  const topMajors = Array.from(new Set(top.map((m) => m.path.majorId))).map((id) => getMajor(id)!);
  const reach = shiftTier(tier, -1);
  const safe = shiftTier(tier, 1);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <div>
          {isSample && <p className="text-xs text-neutral-400">示例报告</p>}
          <h1 className="text-2xl font-bold text-neutral-900">家长决策报告</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!unlocked}>
          <Printer className="h-3.5 w-3.5" /> 打印 / 导出PDF
        </Button>
      </div>
      <h1 className="mb-4 hidden text-2xl font-bold print:block">职业平行人生 · 家长决策报告</h1>
      {isSample && (
        <Link href="/start" className="no-print mb-6 inline-block text-sm text-neutral-900 underline underline-offset-4">
          生成孩子的专属报告
        </Link>
      )}

      {/* 免费预览 */}
      <Card className="print-break mb-4 p-5">
        <SectionTitle title="一、孩子画像摘要" />
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {[
            ["年级", profile.grade],
            ["省份", profile.province],
            ["位次", rank ? `约 ${rank.toLocaleString()}` : "未填写"],
            ["选科", profile.subjects.join("+")],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-400">{k}</dt>
              <dd className="mt-0.5 font-medium text-neutral-800">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 border-l-2 border-brand pl-3 text-sm">
          预估院校层次：
          <span className="font-semibold text-neutral-900">
            {tierName(tier)}（{tier}）
          </span>
          <TierDisclaimer className="mt-1" />
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          <span className="text-neutral-400">兴趣：</span>
          {profile.preferenceTags.join("、")}
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          <span className="text-neutral-400">最在乎：</span>
          {order.slice(0, 3).map((k) => METRIC_LABELS[k]).join(" > ")}
        </p>
      </Card>

      <Card className="print-break mb-4 p-5">
        <SectionTitle title="二、推荐路径排名" />
        <ol className="space-y-3">
          {top.map((m, i) => (
            <li key={m.path.id} className="flex gap-3 rounded-xl border border-neutral-100 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">{i + 1}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-neutral-900">
                    {getMajor(m.path.majorId)?.name} → {m.path.title}
                  </p>
                  <span className="text-sm font-semibold text-accent-600">匹配度 {m.display}%</span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{m.reasons.join("；")}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                  第10年月薪（一般）¥{formatSalary(typicalYear10(resolved[i]))}
                  <SourceTag source={m.path.stages[2].salary.source} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="print-break mb-4 p-5">
        <SectionTitle title="三、选科匹配检查" />
        <div className="grid gap-2 md:grid-cols-2">
          {MAJORS.map((m) => {
            const miss = missingSubjects(m, profile.subjects);
            return (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                <span className="text-neutral-700">{m.name}</span>
                {miss.length === 0 ? (
                  <span className="flex items-center gap-1 text-ideal-700">
                    <CheckCircle2 className="h-4 w-4" /> 满足
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-worst-700">
                    <AlertTriangle className="h-4 w-4" /> 需选考{miss.join("、")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-400">以各校当年招生章程为准</p>
      </Card>

      {/* 付费墙 */}
      <div className="relative">
        {!unlocked && (
          <div className="no-print absolute inset-0 z-10 flex items-start justify-center pt-24">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-neutral-900 bg-white p-6 text-center">
              <Lock className="mx-auto h-6 w-6 text-neutral-900" />
              <p className="mt-3 text-lg font-semibold text-neutral-900">解锁完整报告</p>
              <p className="mt-1 text-sm text-neutral-500">高中准备 · 志愿方向 · 风险与备选</p>
              <Button variant="accent" size="lg" className="mt-5 w-full" onClick={() => setModal(true)}>
                解锁完整报告 ¥99
              </Button>
              <p className="mt-2 text-[11px] text-neutral-400">Demo 模拟付费，不会产生任何扣费</p>
            </div>
          </div>
        )}
        <div className={cn(!unlocked && "pointer-events-none max-h-[640px] select-none overflow-hidden blur-[6px]")}>
          <Card className="print-break mb-4 p-5">
            <SectionTitle title="四、高中阶段可以做的准备" />
            <div className="space-y-4">
              {top.map((m) => (
                <div key={m.path.id}>
                  <p className="text-sm font-medium text-neutral-800">{m.path.title}</p>
                  <ul className="mt-1 space-y-1 text-sm text-neutral-600">
                    {m.path.highSchoolPrep.map((h) => (
                      <li key={h}>· {h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card className="print-break mb-4 p-5">
            <SectionTitle title="五、志愿填报方向建议" />
            <div className="space-y-2 text-sm">
              {[
                { k: "冲", t: reach, cls: "bg-neutral-900 text-white" },
                { k: "稳", t: tier, cls: "bg-neutral-100 text-neutral-900" },
                { k: "保", t: safe, cls: "border border-neutral-200 text-neutral-500" },
              ].map((row, i) => (
                <div key={row.k} className="flex gap-3 rounded-xl border border-neutral-100 p-3">
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold", row.cls)}>{row.k}</span>
                  <p className="text-neutral-700">
                    {i === 0 && `建议冲刺${row.t}（${tierName(row.t)}）院校的${topMajors[0]?.category ?? ""}类专业，如${topMajors[0]?.name}；`}
                    {i === 1 && `稳妥选择${row.t}（${tierName(row.t)}）院校的${topMajors.map((m) => m.name).join("、")}；`}
                    {i === 2 && `保底可以考虑${row.t}（${tierName(row.t)}）院校中就业口碑好的${topMajors[0]?.name}，或同类相近专业。`}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-400">基于简化估算，填报以当年招生计划和往年录取位次为准</p>
          </Card>

          <Card className="print-break mb-4 p-5">
            <SectionTitle title="六、风险提示和备选路径" />
            <div className="space-y-3">
              {resolved.map((p) => {
                const worst = p.scenarios.find((s) => s.type === "worst")!;
                return (
                  <div key={p.id} className="rounded-xl bg-worst-50/60 p-3 text-sm">
                    <p className="font-medium text-neutral-800">{p.title}</p>
                    <p className="mt-1 text-neutral-600">
                      需要留意：{worst.lifeQuality}（约后10%-20%的人第10年月薪约 ¥{formatSalary(worst.year10Salary)}）
                    </p>
                    <p className="mt-1 text-neutral-600">常见补救：{worst.pivotOptions?.slice(0, 2).join("；")}</p>
                  </div>
                );
              })}
            </div>
            {backups.length > 0 && (
              <p className="mt-3 text-sm text-neutral-600">
                <span className="font-medium text-neutral-800">备选路径：</span>
                {backups.map((b) => `${getMajor(b.path.majorId)?.name}→${b.path.title}（匹配度${b.display}%）`).join("；")}
              </p>
            )}
            <StatDisclaimer className="mt-3" />
          </Card>

          <Card className="no-print mb-4 p-5">
            <SectionTitle title="下一步" />
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" size="lg" onClick={() => showToast("一对一规划服务即将上线")}>
                <CalendarCheck className="h-4 w-4" /> 预约一对一规划
              </Button>
              <Button variant="outline" size="lg" onClick={() => showToast("志愿表体检将在志愿季开放")}>
                <ClipboardCheck className="h-4 w-4" /> 志愿表体检（志愿季开放）
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-6" onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <button className="absolute right-3 top-3 text-neutral-400" onClick={() => setModal(false)} aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
              <Unlock className="mx-auto h-9 w-9 text-ideal-500" />
              <p className="mt-3 text-lg font-semibold text-neutral-900">Demo 版本，已为你免费解锁</p>
                            <Button
                className="mt-5 w-full"
                onClick={() => {
                  unlock();
                  setModal(false);
                }}
              >
                查看完整报告
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 z-50 -tranneutral-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Gate>
      <ReportView />
    </Gate>
  );
}
