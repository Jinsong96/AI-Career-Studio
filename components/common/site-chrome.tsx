"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, PlayCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold text-neutral-900", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-snow">
        <Sparkles className="h-4 w-4" />
      </span>
      <span>职业平行人生</span>
    </Link>
  );
}

const NAV = [
  { href: "/results", label: "我的路径" },
  { href: "/compare", label: "对比" },
  { href: "/share", label: "海报" },
  { href: "/report", label: "家长报告" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const loadDemo = useStore((s) => s.loadDemo);
  const compareCount = useStore((s) => s.compareIds.length);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900",
                pathname.startsWith(n.href) && "font-medium text-neutral-900",
              )}
            >
              {n.label}
              {n.href === "/compare" && compareCount > 0 && <span className="ml-1 rounded-full bg-neutral-900 px-1.5 text-[10px] text-white">{compareCount}</span>}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => {
            loadDemo();
            router.push("/path/cs-backend/story");
          }}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-700 hover:border-neutral-400"
          title="示例学生：河南，位次35000，物理+化学+生物"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          一键演示
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-neutral-200 pb-24 pt-6 md:pb-6">
      <p className="mx-auto max-w-6xl px-4 text-center text-xs text-neutral-400">Demo 版本，所有数据为示例，仅用于演示产品体验</p>
    </footer>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/start") || pathname.startsWith("/path/")) return null;
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={cn("py-3.5 text-center text-xs text-neutral-500", pathname.startsWith(n.href) && "font-semibold text-neutral-900")}>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
