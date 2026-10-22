"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** 低端设备或窄屏时降低粒子数量 */
export function particleBudget(base: number): number {
  if (typeof window === "undefined") return base;
  const cores = navigator.hardwareConcurrency ?? 4;
  const narrow = window.innerWidth < 768;
  let n = base;
  if (narrow) n *= 0.45;
  if (cores <= 4) n *= 0.6;
  return Math.max(20, Math.round(n));
}
