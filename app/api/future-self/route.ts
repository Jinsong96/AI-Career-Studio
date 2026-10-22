import Anthropic from "@anthropic-ai/sdk";
import type { SchoolTier } from "@/types";
import { getPath } from "@/lib/data";
import { MODEL, getClient } from "@/lib/llm";
import { MAX_TURNS, distressReply, systemPrompt } from "@/lib/future-self";

type Body = { pathId: string; tier: SchoolTier; choices: Record<string, string>; seed: number; age?: number; messages: { role: "user" | "assistant"; text: string }[] };

/** 和32岁的你聊天：流式返回纯文本；没有 Key 时返回 503，前端走离线问答 */
export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const path = getPath(body.pathId);
  const client = getClient();
  if (!path) return new Response("unknown path", { status: 400 });
  if (!client) return new Response("offline", { status: 503 });

  const messages = body.messages.slice(-2 * MAX_TURNS).map((m) => ({ role: m.role, content: String(m.text).slice(0, 500) }));
  if (messages.filter((m) => m.role === "user").length > MAX_TURNS) return new Response("too many turns", { status: 429 });
  const last = messages[messages.length - 1];
  const care = last && last.role === "user" ? distressReply(last.content) : null;
  if (care) return new Response(care, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: systemPrompt(path, body.tier, body.choices ?? {}, body.seed, Math.min(40, Math.max(28, Number(body.age) || 32))),
    messages,
  } as unknown as Anthropic.Beta.MessageCreateParamsStreaming);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(encoder.encode(event.delta.text));
        }
      } catch (error) {
        if (error instanceof Anthropic.APIError) console.error(`Claude API error ${error.status}:`, error.message);
        else console.error("future-self stream failed:", error);
        controller.enqueue(encoder.encode("（信号不太好，这个问题我们换个时间再聊。）"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
