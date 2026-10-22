import { NextResponse } from "next/server";
import { complete, getClient } from "@/lib/llm";
import { ruleParse } from "@/lib/parse-rules";

export async function POST(req: Request) {
  const { freeText = "", availableTags = [] } = (await req.json()) as { freeText?: string; availableTags?: string[] };
  const text = String(freeText).slice(0, 300);
  const client = getClient();

  if (client && text.trim()) {
    const prompt = `你是高中生职业兴趣分析助手。根据学生写的一句话，从下列标签中选出最相关的1到5个，只能从列表中选择，不能自己编造。
标签列表：${availableTags.join("、")}
学生输入："${text}"
请只输出 JSON：{"tags": [...], "interpretation": "用一句温和的话复述你理解到的学生意愿"}`;
    const out = await complete(client, prompt, 1024);
    if (out) {
      try {
        const json = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)) as { tags?: string[]; interpretation?: string };
        // 只保留标签库里的标签，防止模型编造
        const tags = (json.tags ?? []).filter((t) => availableTags.includes(t)).slice(0, 5);
        return NextResponse.json({ tags, interpretation: json.interpretation ?? "", mode: "llm" });
      } catch {
        /* 解析失败则降级 */
      }
    }
  }
  return NextResponse.json({ ...ruleParse(text, availableTags), mode: "rules" });
}
