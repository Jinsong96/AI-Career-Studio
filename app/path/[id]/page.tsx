"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Bot, Check, FileText, GraduationCap, Image as ImageIcon, MapPin, Plus, ShieldCheck, Sparkles, Briefcase } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { TimelineSection } from "@/components/timeline/section";
import { SalaryBar } from "@/components/timeline/salary-bar";
import { Narrative } from "@/components/timeline/narrative";
import { DaySchedule } from "@/components/day-schedule/day-schedule";
import { ScenarioCards } from "@/components/scenario/scenario-cards";
import { BranchBreadcrumb, BranchNodeCard } from "@/components/branch/branch-node";
import { LifeRadar } from "@/components/radar/life-radar";
import { SourceTag } from "@/components/common/source-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResolvedPath, useTier } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { getMajor, tierName } from "@/lib/data";
import { branchYear, type ResolvedPath } from "@/lib/branch";
import { METRIC_KEYS, METRIC_LABELS, displayScore } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { universeId } from "@/lib/story";

const DEST_COLORS = ["#3B4CCA", "#7A86E0", "#FF8A3D", "#10B981", "#CBD5E1"];

function Radar({ path }: { path: ResolvedPath }) {
  const changed = path.chosen.length > 0;
  return (
    <Card className="p-4">
      <p className="font-semibold text-neutral-900">综合指标</p>
      {changed && <p className="text-xs text-neutral-500">实线：你的选择 · 虚线：原始路径</p>}
      <LifeRadar
        series={[
          ...(changed ? [{ name: "原始路径", metrics: path.baseMetrics, color: "#94a3b8", dashed: true }] : []),
          { name: "当前选择", metrics: path.metrics, color: "#3B4CCA" },
        ]}
        height={250}
      />
      <div className="grid grid-cols-3 gap-1.5">
        {METRIC_KEYS.map((k) => {
          const now = displayScore(path.metrics, k);
          const diff = now - displayScore(path.baseMetrics, k);
          return (
            <div key={k} className="rounded-lg bg-neutral-50 px-2 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400">{METRIC_LABELS[k]}</p>
              <p className="text-sm font-semibold text-neutral-800">
                {now}
                {diff !== 0 && <span className={cn("ml-0.5 text-[10px]", diff > 0 ? "text-ideal-700" : "text-worst-700")}>{diff > 0 ? `+${diff}` : diff}</span>}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Detail({ id }: { id: string }) {
  const path = useResolvedPath(id);
  const tier = useTier();
  const hasProfile = useStore((s) => s.hasProfile);
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const choices = useStore((s) => s.branchChoices[id]) ?? {};

  if (!path) {
    return (
      <div className="py-20 text-center text-neutral-500">
        找不到这条路径，<Link href="/results" className="text-brand underline">返回结果页</Link>
      </div>
    );
  }

  const major = getMajor(path.majorId);
  const u = path.university;
  const scaleMax = Math.max(...path.stages.map((s) => s.salary.p90)) * 1.05;
  const gradBranches = path.branches.filter((b) => branchYear(b.atStage) === 0);
  const inCompare = compareIds.includes(id);

  // 某个分叉之后的内容在选择变化时淡出再淡入
  const keyAfter = (year: number) =>
    path.branches
      .filter((b) => branchYear(b.atStage) <= year)
      .map((b) => choices[b.id] ?? "-")
      .join("|");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <Link href={hasProfile ? "/results" : "/"} className="inline-flex min-h-[44px] items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> 返回
        </Link>
        <Link href={`/path/${id}/story`} className="inline-flex min-h-[44px] items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
          <BookOpen className="h-3.5 w-3.5" /> 故事模式
        </Link>
      </div>
      <p className="font-mono text-[11px] tracking-wider text-neutral-400">{universeId(path)} · DATA VIEW</p>

      <header className="mb-5">
        <p className="text-sm text-neutral-500">
          {major?.name} · {major?.duration}年制
        </p>
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">{path.title}</h1>
        <p className="mt-1 text-neutral-600">{path.tagline}</p>
        <p className="mt-2 text-xs text-neutral-400">
          按{tierName(tier)}（{tier}）推演，薪资已根据你的预估院校层次调整
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Narrative path={path} />

          {path.chosen.length > 0 ? (
            <div className="sticky top-14 z-20 -mx-4 mb-8 mt-4 border-b border-neutral-200 bg-[var(--bg)]/95 px-4 py-2.5 backdrop-blur lg:mx-0">
              <BranchBreadcrumb pathId={id} nodes={path.branches} />
            </div>
          ) : (
            <div className="mb-8" />
          )}

          {/* 1. 大学四年 */}
          <TimelineSection dot={<GraduationCap className="h-4 w-4" />} title={`大学${major?.duration === 5 ? "五" : "四"}年`} sub={<SourceTag source={u.source} />}>
            <Card className="p-4 md:p-5">
              <ol className="space-y-2.5">
                {u.yearByYear.map((y) => (
                  <li key={y.year} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-xs font-medium text-neutral-400">大{"一二三四五"[y.year - 1]}</span>
                    <span className="text-sm text-neutral-700">{y.description}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4">
                <p className="mb-2 text-xs text-neutral-400">核心课程 · <span className="text-accent-600">最难</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {u.coreCourses.concat(u.hardestCourses.filter((h) => !u.coreCourses.includes(h))).map((c) => (
                    <span
                      key={c}
                      className={cn("rounded-lg px-2 py-1 text-xs", u.hardestCourses.includes(c) ? "bg-accent-50 font-medium text-accent-600" : "bg-neutral-100 text-neutral-600")}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-[11px] text-neutral-400">学业压力</p>
                  <div className="mt-1.5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={cn("h-2 flex-1 rounded-full", n <= u.pressureLevel ? "bg-accent" : "bg-neutral-200")} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">{u.pressureLevel}/5</p>
                </div>
                {[
                  ["转专业难度", u.switchMajorDifficulty],
                  ["考研率", u.postgradRate],
                  ["出国率", u.abroadRate],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-[11px] text-neutral-400">{k}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-800">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-l-2 border-brand pl-3">
                <p className="text-xs text-neutral-400">
                  {tierName(tier)}（{tier}）院校
                </p>
                <p className="mt-1 text-sm text-neutral-700">{path.tierNotes[tier]}</p>
              </div>
            </Card>
          </TimelineSection>

          {/* 2. 毕业那年 */}
          <TimelineSection dot="毕" title="毕业那年" sub={<SourceTag source={path.graduation.source} />}>
            <Card className="p-4 md:p-5">
              <p className="mb-2 text-xs text-neutral-400">毕业去向</p>
              <div className="flex h-4 overflow-hidden rounded-full">
                {path.graduation.destinations.map((d, i) => (
                  <motion.div
                    key={d.label}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.percent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                    style={{ background: DEST_COLORS[i % DEST_COLORS.length] }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {path.graduation.destinations.map((d, i) => (
                  <div key={d.label} className="flex items-center gap-1.5 whitespace-nowrap text-sm">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DEST_COLORS[i % DEST_COLORS.length] }} />
                    <span className="text-neutral-600">{d.label}</span>
                    <span className="font-semibold text-neutral-900">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </Card>
            {gradBranches.map((b) => (
              <div key={b.id} className="mt-4">
                <BranchNodeCard pathId={id} node={b} />
              </div>
            ))}
          </TimelineSection>

          {/* 3. 第3/5/10年 */}
          {path.stages.map((s) => {
            const after = path.branches.filter((b) => branchYear(b.atStage) === s.yearsAfterGrad && s.yearsAfterGrad > 0);
            return (
              <TimelineSection key={s.label} dot={s.yearsAfterGrad} title={`工作${s.label}`} sub={<SourceTag source={s.salary.source} extra="已根据院校层次和你的分叉选择调整" />}>
                <AnimatePresence mode="wait">
                  <motion.div key={keyAfter(s.yearsAfterGrad - 1)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <Card className="p-4 md:p-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-neutral-400" />
                        {s.typicalRoles.map((r) => (
                          <Badge key={r} variant="gray" className="text-[13px]">
                            {r}
                          </Badge>
                        ))}
                      </div>
                      <p className="mb-2 mt-4 text-xs text-neutral-400">月薪区间（税前）</p>
                      <SalaryBar salary={s.salary} scaleMax={scaleMax} />
                      <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-neutral-600">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        {s.cities.join(" · ")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{s.lifeDescription}</p>
                    </Card>
                  </motion.div>
                </AnimatePresence>
                {after.map((b) => (
                  <div key={b.id} className="mt-4">
                    <BranchNodeCard pathId={id} node={b} />
                  </div>
                ))}
              </TimelineSection>
            );
          })}

          {/* 4. 典型的一天 */}
          <TimelineSection dot={<Sparkles className="h-4 w-4" />} title="典型的一天" accent>
            <DaySchedule day={path.dayInLife} />
          </TimelineSection>

          {/* 5. 三种情况 */}
          <TimelineSection dot="10" title="第10年的三种情况">
            <AnimatePresence mode="wait">
              <motion.div key={keyAfter(99)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <ScenarioCards scenarios={path.scenarios} source={path.stages[2].salary.source} />
              </motion.div>
            </AnimatePresence>
          </TimelineSection>

          {/* 6. AI 风险 */}
          <TimelineSection dot={<Bot className="h-4 w-4" />} title="AI时代的风险">
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3">
                <p className="text-sm text-neutral-700">{path.aiRisk.summary}</p>
                <div className="shrink-0 text-center">
                  <p className="text-2xl font-bold text-brand">{path.metrics.aiResilience}</p>
                  <p className="text-[10px] text-neutral-400">AI抗风险评分</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-worst-100 p-3">
                  <p className="text-xs font-medium text-worst-700">容易被替代的任务</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-neutral-600">
                    {path.aiRisk.replaceableTasks.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-ideal-100 p-3">
                  <p className="text-xs font-medium text-ideal-700">不容易被替代的任务</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-neutral-600">
                    {path.aiRisk.resilientTasks.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mb-1.5 mt-4 text-xs font-medium text-neutral-400">你需要提前培养的能力</p>
              <div className="flex flex-wrap gap-1.5">
                {path.aiRisk.skillsToBuild.map((s) => (
                  <Badge key={s}>
                    <ShieldCheck className="h-3 w-3" /> {s}
                  </Badge>
                ))}
              </div>
            </Card>
          </TimelineSection>

          {/* 7. 雷达图（移动端） */}
          <TimelineSection dot="◎" title="综合指标" className="lg:hidden">
            <Radar path={path} />
          </TimelineSection>

        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-3">
            <Radar path={path} />
            <Card className="p-4 text-sm text-neutral-600">
              <p className="font-medium text-neutral-800">高中可以做的准备</p>
              <ul className="mt-2 space-y-1">
                {path.highSchoolPrep.map((h) => (
                  <li key={h}>· {h}</li>
                ))}
              </ul>
            </Card>
          </div>
        </aside>
      </div>

      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" className="flex-1" onClick={() => toggleCompare(id)}>
            {inCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {inCompare ? "已加入对比" : "加入对比"}
          </Button>
          <Link href={`/share?ids=${id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <ImageIcon className="h-4 w-4" /> 海报
            </Button>
          </Link>
          <Link href="/report" className="flex-1">
            <Button className="w-full">
              <FileText className="h-4 w-4" /> 家长报告
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PathPage() {
  const params = useParams<{ id: string }>();
  return (
    <Gate>
      <Detail id={params.id} />
    </Gate>
  );
}
