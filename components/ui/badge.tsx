import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-brand-50 text-brand",
      accent: "bg-accent-50 text-accent-600",
      gray: "bg-neutral-100 text-neutral-600",
      warn: "bg-worst-100 text-worst-700",
      ideal: "bg-ideal-100 text-ideal-700",
      typical: "bg-typical-100 text-typical-700",
      worst: "bg-worst-100 text-worst-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
