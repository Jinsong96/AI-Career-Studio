"use client";

import type { Artifact, LifeEvent } from "@/types";
import type { ResolvedPath } from "@/lib/branch";
import { fillTemplate, resolveRef, type StoryContext } from "@/lib/story";
import { ChatThread, type ChatData } from "./chat-thread";
import { MomentsPost, type MomentsData } from "./moments-post";
import { Payslip } from "./payslip";
import { CalendarDay } from "./calendar-day";
import { OfferLetter, type OfferData } from "./offer-letter";

/** 文本字段里的占位符替换成数据；带 requiresEvent 的物品只在这一次触发了对应事件时出现 */
export function ArtifactView({ artifact, path, ctx, triggered }: { artifact: Artifact; path: ResolvedPath; ctx: StoryContext; triggered: LifeEvent[] }) {
  const d = artifact.data;
  if (typeof d.requiresEvent === "string" && !triggered.some((e) => e.id === d.requiresEvent)) return null;
  const fill = (v: unknown) => (typeof v === "string" ? fillTemplate(v, path, ctx) : v);
  const num = (ref: unknown) => (typeof ref === "string" ? (resolveRef(path, ref) as number) : 0);

  switch (artifact.type) {
    case "chat": {
      const c = d as unknown as ChatData;
      return <ChatThread data={{ title: String(fill(c.title)), messages: c.messages.map((m) => ({ ...m, text: String(fill(m.text)) })) }} />;
    }
    case "moments":
      return <MomentsPost data={{ ...(d as unknown as MomentsData), text: String(fill(d.text)) }} />;
    case "offer":
      return <OfferLetter data={{ ...(d as unknown as OfferData), org: String(fill(d.org)), text: String(fill(d.text)) }} />;
    case "payslip": {
      const stageIndex = Number(String(d.grossRef).match(/\d+/)?.[0] ?? 0);
      return (
        <Payslip
          data={{ company: String(fill(d.company)), period: String(d.period), gross: num(d.grossRef), low: num(d.lowRef), high: num(d.highRef), source: path.stages[stageIndex].salary.source }}
        />
      );
    }
    case "calendar":
      return <CalendarDay label={String(d.label)} day={path.dayInLife} />;
  }
}
