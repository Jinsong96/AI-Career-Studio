"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Gate } from "@/components/common/gate";
import { Typewriter } from "@/components/common/typewriter";
import { useLlmAvailable, useResolvedPath, useSimulation, useTier } from "@/lib/hooks";
import { EMPTY_PROFILE, useStore, type ChatMessage } from "@/lib/store";
import { getMajor, getPath } from "@/lib/data";
import { chapterContext, chapterTime, fillTemplate, universeId } from "@/lib/story";
import { MAX_TURNS, OFFLINE_REPLY, PRESET_QUESTIONS, distressReply, openingLine } from "@/lib/future-self";
import { cn } from "@/lib/utils";

function Silhouette({ size = 40 }: { size?: number }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#6070F2] to-[#1b2163] shadow-[0_0_24px_rgba(96,112,242,0.7)]" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-3/5 w-3/5 fill-[#c7ceff]/80">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
      </svg>
    </span>
  );
}

function Chat({ id }: { id: string }) {
  const path = useResolvedPath(id);
  const run = useSimulation(id);
  const tier = useTier();
  const llm = useLlmAvailable();
  const hasProfile = useStore((s) => s.hasProfile);
  const storeProfile = useStore((s) => s.profile);
  const profile = hasProfile ? storeProfile : EMPTY_PROFILE;
  const choices = useStore((s) => s.branchChoices[id]) ?? {};
  const saved = useStore((s) => s.chats[id]);
  const setChat = useStore((s) => s.setChat);
  const [messages, setMessages] = useState<ChatMessage[]>(saved ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (!path || !run) return null;
  const sim = run.sim;
  const age = chapterTime("w10", profile.grade, getMajor(path.majorId)?.duration ?? 4).age;
  const ctx = chapterContext(path, "w10", profile, sim.role);
  const opening = openingLine(getPath(id)!, sim, choices, age, ctx.city);
  const turns = messages.filter((m) => m.role === "user").length;
  const left = MAX_TURNS - turns;

  const commit = (next: ChatMessage[]) => {
    setMessages(next);
    setChat(id, next);
  };

  const ask = async (text: string, presetKey?: string) => {
    if (!text.trim() || busy || left <= 0) return;
    const history: ChatMessage[] = [...messages, { role: "user", text }];
    commit(history);
    setInput("");
    const care = distressReply(text);

    if (care || !llm) {
      const faq = presetKey ? path.futureSelfFAQ[presetKey as keyof typeof path.futureSelfFAQ] : undefined;
      const reply = care ?? (faq ? fillTemplate(faq, path, ctx) : OFFLINE_REPLY);
      setTyping(history.length);
      commit([...history, { role: "assistant", text: reply }]);
      return;
    }

    setBusy(true);
    let acc = "";
    try {
      const res = await fetch("/api/future-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathId: id, tier, choices, seed: sim.seed, age, messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", text: acc }]);
      }
      commit([...history, { role: "assistant", text: acc || OFFLINE_REPLY }]);
    } catch {
      const faq = presetKey ? path.futureSelfFAQ[presetKey as keyof typeof path.futureSelfFAQ] : undefined;
      commit([...history, { role: "assistant", text: faq ? fillTemplate(faq, path, ctx) : OFFLINE_REPLY }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 pb-44 pt-4">
      <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
        <Link href={`/path/${id}/story`} className="flex min-h-[44px] items-center text-neutral-500 hover:text-neutral-900" aria-label="返回故事">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Silhouette />
        <div>
          <p className="font-semibold text-neutral-900">{age}岁的你</p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ideal-500" />
            来自 {universeId(path)}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 py-6" aria-live="polite">
        <Bubble role="assistant">
          <Typewriter text={opening} instant={messages.length > 0} />
        </Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.role === "assistant" && typing === i ? <Typewriter text={m.text} onDone={() => setTyping(null)} /> : m.text}
            {m.role === "assistant" && busy && i === messages.length - 1 && <span className="caret" />}
          </Bubble>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <Bubble role="assistant">
            <span className="caret" />
          </Bubble>
        )}
        <div ref={bottom} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q.key}
                disabled={busy || left <= 0}
                onClick={() => ask(q.text, q.key)}
                className="min-h-[36px] shrink-0 cursor-pointer rounded-full border border-neutral-200 px-3 text-xs text-neutral-700 transition-colors hover:border-brand disabled:opacity-40"
              >
                {q.text}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy || left <= 0}
              maxLength={200}
              placeholder={left > 0 ? "想问点别的……" : "这次会话已经聊了10轮"}
              aria-label="输入问题"
              className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
            />
            <button type="submit" disabled={busy || !input.trim() || left <= 0} aria-label="发送" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-brand text-snow disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 flex justify-between font-mono text-[10px] text-neutral-400">
            <span>这是AI根据数据扮演的角色，不是真实的人</span>
            <span>
              {turns}/{MAX_TURNS}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex gap-2.5", role === "user" && "flex-row-reverse")}>
      {role === "assistant" && <Silhouette size={30} />}
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed", role === "assistant" ? "rounded-tl-sm border border-brand/40 bg-brand-50 text-neutral-800" : "rounded-tr-sm bg-neutral-100 text-neutral-900")}>{children}</div>
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Gate>
      <Chat id={id} />
    </Gate>
  );
}
