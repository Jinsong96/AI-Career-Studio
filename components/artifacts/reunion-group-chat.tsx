"use client";

import { useRouter } from "next/navigation";
import { ChatThread } from "./chat-thread";

export type ReunionMember = { name: string; text: string; href: string };

/** 毕业10年同学群：其他候选路径的同学在聊近况，点消息跳到对应路径 */
export function ReunionGroupChat({ members, myLine }: { members: ReunionMember[]; myLine: string }) {
  const router = useRouter();
  return (
    <ChatThread
      onMessageClick={(href) => router.push(href)}
      data={{
        title: `高三（2）班 · 毕业十年（${members.length + 1}）`,
        messages: [{ from: "them", name: "班长", text: "十年了！大家都在干嘛，报个到" }, ...members.map((m) => ({ from: "them" as const, ...m })), { from: "me", name: "我", text: myLine }],
      }}
    />
  );
}
