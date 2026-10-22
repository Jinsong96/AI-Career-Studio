import { Avatar, PhoneFrame } from "./shared";

export type ChatData = { title: string; messages: { from: "me" | "them"; name: string; text: string; href?: string }[] };

export function ChatThread({ data, onMessageClick }: { data: ChatData; onMessageClick?: (href: string) => void }) {
  const group = new Set(data.messages.filter((m) => m.from === "them").map((m) => m.name)).size > 1;
  return (
    <PhoneFrame title={data.title}>
      <div className="space-y-3 px-3 py-4">
        {data.messages.map((m, i) => (
          <div key={i} className={m.from === "me" ? "flex flex-row-reverse items-start gap-2" : "flex items-start gap-2"}>
            <Avatar name={m.name} me={m.from === "me"} />
            <div className="max-w-[75%]">
              {group && m.from === "them" && <p className="mb-0.5 text-[11px] text-[#888]">{m.name}</p>}
              <p
                onClick={() => m.href && onMessageClick?.(m.href)}
                className={
                  "rounded-md px-3 py-2 text-[14px] leading-snug text-[#111] " +
                  (m.from === "me" ? "bg-[#95EC69]" : "bg-[#FFFFFF]") +
                  (m.href ? " cursor-pointer underline decoration-[#bbb] underline-offset-4" : "")
                }
              >
                {m.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}
