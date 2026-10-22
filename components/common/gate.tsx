"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

/** 等 localStorage 状态恢复后再渲染；requireProfile 时没有画像则引导去填写 */
export function Gate({ children, requireProfile = false }: { children: React.ReactNode; requireProfile?: boolean }) {
  const hydrated = useHydrated();
  const hasProfile = useStore((s) => s.hasProfile);
  const loadDemo = useStore((s) => s.loadDemo);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <div className="h-8 w-1/2 animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />
      </div>
    );
  }
  if (requireProfile && !hasProfile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold text-neutral-800">还没有你的信息</p>
        <p className="mt-2 text-sm text-neutral-500">先花1分钟填写分数和兴趣，或者直接看看示例学生的平行人生。</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/start">
            <Button>开始填写</Button>
          </Link>
          <Button variant="outline" onClick={loadDemo}>
            看示例学生
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
