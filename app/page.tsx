"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMajor, getPath } from "@/lib/data";
import { formatSalary, resolvePath, typicalYear10 } from "@/lib/branch";
import { SourceTag } from "@/components/common/source-tag";
import { cn } from "@/lib/utils";

const SAMPLE_IDS = ["cs-backend", "med-doctor", "vet-pet"];

function SampleCard({ id, active }: { id: string; active?: boolean }) {
  const path = getPath(id)!;
  const r = resolvePath(path, "T3");
  const moment = path.dayInLife.schedule[Math.min(2, path.dayInLife.schedule.length - 1)];
  return (
    <Link
      href={`/path/${id}/story`}
      className={cn("block rounded-2xl border bg-white p-5 transition-colors duration-200", active ? "border-neutral-900" : "border-neutral-200 hover:border-neutral-400")}
    >
      <p className="text-xs text-neutral-500">{getMajor(path.majorId)?.name}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900">{path.title}</p>
      <p className="mt-4 text-sm text-neutral-600">
        <span className="mr-2 font-mono text-brand">{moment.time}</span>
        {moment.activity}
      </p>
      <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-4">
        <div>
          <p className="text-xs text-neutral-500">第10年月薪</p>
          <p className="text-xl font-semibold tabular-nums text-neutral-900">¥{formatSalary(typicalYear10(r))}</p>
        </div>
        <SourceTag source={path.stages[2].salary.source} />
      </div>
    </Link>
  );
}

export default function Home() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % SAMPLE_IDS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center md:pt-24">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl">
          在选专业之前，
          <br className="md:hidden" />
          先<span className="text-brand">试穿</span>你的未来
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-neutral-500">输入分数和兴趣，看看10年后的你过着怎样的一天</p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link href="/start">
            <Button size="lg" className="h-12 px-7">
              开始预演我的人生 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/report" className="text-sm text-neutral-500 hover:text-neutral-900">
            我是家长
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="hidden gap-4 md:grid md:grid-cols-3">
          {SAMPLE_IDS.map((id, i) => (
            <div key={id} onMouseEnter={() => setActive(i)}>
              <SampleCard id={id} active={active === i} />
            </div>
          ))}
        </div>
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div key={SAMPLE_IDS[active]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <SampleCard id={SAMPLE_IDS[active]} active />
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex justify-center gap-1">
            {SAMPLE_IDS.map((id, i) => (
              <button key={id} aria-label={`示例${i + 1}`} onClick={() => setActive(i)} className="flex h-11 w-8 items-center justify-center">
                <span className={cn("h-1.5 rounded-full transition-all", active === i ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-300")} />
              </button>
            ))}
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-neutral-400">数据来自高校就业报告和真实从业者，AI只负责讲述，不编造数字</p>
      </section>
    </div>
  );
}
