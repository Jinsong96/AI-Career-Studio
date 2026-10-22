import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-neutral-200 bg-white", className)} {...props} />;
}

export function SectionTitle({ icon, title, sub, className }: { icon?: React.ReactNode; title: string; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-2", className)}>
      <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
        {icon}
        {title}
      </h2>
      {sub}
    </div>
  );
}
