"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** 打字机效果；speed 为每字毫秒数，instant 时直接显示全文 */
export function Typewriter({ text, speed = 28, instant, className, onDone }: { text: string; speed?: number; instant?: boolean; className?: string; onDone?: () => void }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const skip = instant || reduced;

  useEffect(() => {
    setN(skip ? text.length : 0);
  }, [text, skip]);

  useEffect(() => {
    if (n >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setN((x) => x + 1), speed);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, text, speed]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {text.slice(0, n)}
      {n < text.length && <span className="caret" aria-hidden />}
      <span className="sr-only">{text}</span>
    </span>
  );
}
