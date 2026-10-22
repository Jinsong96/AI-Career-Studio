import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

/** 仅在服务端使用；没有 Key 时返回 null，调用方走降级方案 */
export function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

/** 单次短文本生成。被拒绝或出错时返回 null */
export async function complete(client: Anthropic, prompt: string, maxTokens: number): Promise<string | null> {
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort: "low" },
      // 安全分类器拒绝时由服务端自动换模型重试
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: prompt }],
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return text.trim() || null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error(`Claude API error ${error.status}:`, error.message);
    else console.error("Claude request failed:", error);
    return null;
  }
}
