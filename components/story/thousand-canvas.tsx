"use client";

import { useEffect, useRef } from "react";
import type { SimResult } from "@/lib/simulate";
import { formatSalary } from "@/lib/branch";

const COLOR = { ideal: "#10B981", typical: "#3B82F6", worst: "#F59E0B" } as const;
const BINS = 26;

export type Histogram = { min: number; max: number; bins: number[]; binOf: (salary: number) => number };

export function buildHistogram(runs: SimResult[]): Histogram {
  const sal = runs.map((r) => r.year10Salary);
  const min = Math.min(...sal);
  const max = Math.max(...sal);
  const span = Math.max(1, max - min);
  const binOf = (s: number) => Math.min(BINS - 1, Math.floor(((s - min) / span) * BINS));
  const bins = Array(BINS).fill(0);
  sal.forEach((s) => bins[binOf(s)]++);
  return { min, max, bins, binOf };
}

/** 1000个光点像弹珠台一样落下，堆成第10年月薪的直方图 */
export function ThousandCanvas({ runs, highlight, height = 340, animate = true, onDone }: { runs: SimResult[]; highlight?: number; height?: number; animate?: boolean; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || runs.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduced = !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hist = buildHistogram(runs);
    const padX = 12;
    const base = H - 28;
    const colW = (W - padX * 2) / BINS;
    const r = Math.max(1.2, Math.min(colW / 4.2, 2.6));
    const perRow = Math.max(1, Math.floor(colW / (r * 2.1)));
    const tallest = Math.max(...hist.bins.map((n) => Math.ceil(n / perRow)));
    const rowH = Math.min(r * 2.1, (base - 40) / Math.max(1, tallest));
    const fill = Array(BINS).fill(0);
    const order = runs.map((_, i) => i).sort(() => 0.5 - Math.random());

    const dots = order.map((i, k) => {
      const run = runs[i];
      const b = hist.binOf(run.year10Salary);
      const n = fill[b]++;
      const tx = padX + b * colW + colW / 2 + ((n % perRow) - (perRow - 1) / 2) * r * 2.1;
      const ty = base - Math.floor(n / perRow) * rowH - r;
      return { tx, ty, sx: W / 2 + (Math.random() - 0.5) * 30, start: (k / runs.length) * 2200, dur: 700 + Math.random() * 300, color: COLOR[run.ending], phase: Math.random() * 6 };
    });

    const hb = highlight !== undefined ? hist.binOf(highlight) : -1;

    const drawStatic = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      // 弹珠台的钉子
      ctx.fillStyle = "rgba(199,206,255,0.12)";
      for (let row = 0; row < 6; row++) {
        for (let c = 0; c <= 12; c++) {
          const x = W / 2 + (c - 6 + (row % 2) * 0.5) * (W / 16);
          ctx.beginPath();
          ctx.arc(x, 24 + row * 16, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = "rgba(199,206,255,0.25)";
      ctx.beginPath();
      ctx.moveTo(padX, base + 0.5);
      ctx.lineTo(W - padX, base + 0.5);
      ctx.stroke();
      ctx.fillStyle = "rgba(199,206,255,0.55)";
      ctx.font = "10px var(--font-mono), monospace";
      ctx.textAlign = "left";
      ctx.fillText(`¥${formatSalary(hist.min)}`, padX, base + 16);
      ctx.textAlign = "right";
      ctx.fillText(`¥${formatSalary(hist.max)}`, W - padX, base + 16);

      for (const d of dots) {
        const p = reduced ? 1 : Math.min(1, Math.max(0, (t - d.start) / d.dur));
        if (p <= 0) continue;
        const e = p * p;
        const x = d.sx + (d.tx - d.sx) * p + (p < 1 ? Math.sin(p * 18 + d.phase) * 10 * (1 - p) : 0);
        const y = -6 + (d.ty + 6) * e;
        ctx.globalAlpha = p < 1 ? 0.9 : 0.85;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const finished = reduced || t > 2200 + 1000;
      if (finished && hb >= 0) {
        const cx = padX + hb * colW + colW / 2;
        const top = base - Math.ceil(hist.bins[hb] / perRow) * rowH - 10;
        ctx.strokeStyle = "#FF8A3D";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx, 46);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#FF8A3D";
        ctx.beginPath();
        ctx.arc(cx, top, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "12px -apple-system, 'PingFang SC', sans-serif";
        ctx.textAlign = cx > W * 0.7 ? "right" : cx < W * 0.3 ? "left" : "center";
        ctx.fillText(`这是刚才的你 · ¥${formatSalary(highlight!)}`, cx, 40);
      }
      return finished;
    };

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const done = drawStatic(performance.now() - t0);
      if (done) {
        onDone?.();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, highlight, height, animate]);

  return <canvas ref={ref} className="block w-full" style={{ height }} role="img" aria-label="1000次模拟的第10年月薪分布" />;
}
