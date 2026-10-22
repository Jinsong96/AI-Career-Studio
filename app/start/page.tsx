"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Gate } from "@/components/common/gate";
import { useStore } from "@/lib/store";
import { StepBasic } from "@/components/wizard/step-basic";
import { StepInterest } from "@/components/wizard/step-interest";
import { StepValues } from "@/components/wizard/step-values";
import { StepConfirm } from "@/components/wizard/step-confirm";

const STEPS = ["基础信息", "你对什么感兴趣", "你最在乎什么", "确认"];

function Wizard() {
  const router = useRouter();
  const step = useStore((s) => s.wizardStep);
  const setStep = useStore((s) => s.setWizardStep);
  const profile = useStore((s) => s.profile);
  const finishWizard = useStore((s) => s.finishWizard);

  const canNext =
    step === 0
      ? profile.subjects.length === 3 && (profile.inputMode === "skip" || (profile.inputMode === "rank" ? !!profile.rank : !!profile.score))
      : step === 1
        ? profile.preferenceTags.length > 0
        : true;

  const hint =
    step === 0 && !canNext
      ? profile.subjects.length !== 3
        ? "选科需 1 + 2 门"
        : "请填写成绩"
      : step === 1 && !canNext
        ? "至少选 1 个"
        : "";

  const generate = () => {
    finishWizard();
    router.push("/results");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      <div className="mb-6">
        <p className="mb-2 text-xs tabular-nums text-neutral-500">
          {step + 1} / {STEPS.length}
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-neutral-200">
          <motion.div className="h-full rounded-full bg-neutral-900" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
          {step === 0 && <StepBasic />}
          {step === 1 && <StepInterest />}
          {step === 2 && <StepValues />}
          {step === 3 && <StepConfirm onEdit={setStep} />}
        </motion.div>
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}>
            <ArrowLeft className="h-4 w-4" /> 上一步
          </Button>
          <div className="flex-1 text-right text-xs text-worst-700">{hint}</div>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
              下一步 <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="accent" onClick={generate}>
              生成我的平行人生 <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}

export default function StartPage() {
  return (
    <Gate>
      <Wizard />
    </Gate>
  );
}
