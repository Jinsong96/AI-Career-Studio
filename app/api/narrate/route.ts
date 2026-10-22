import { NextResponse } from "next/server";
import type { ResolvedPath } from "@/lib/branch";
import { complete, getClient } from "@/lib/llm";
import { templateNarrative } from "@/lib/narrate";

/** 数字检查：叙述中出现的每个数字都必须出现在提供的数据里，否则弃用 */
function numbersAreGrounded(text: string, data: string): boolean {
  const nums = text.match(/\d+(\.\d+)?/g) ?? [];
  return nums.every((n) => data.includes(n));
}

export async function POST(req: Request) {
  const { path } = (await req.json()) as { path: ResolvedPath };
  const fallback = { text: templateNarrative(path), mode: "template" as const };
  const client = getClient();
  if (!client) return NextResponse.json(fallback);

  const y10 = path.stages.find((s) => s.yearsAfterGrad === 10);
  const typical = path.scenarios.find((s) => s.type === "typical");
  const pathData = {
    职业: path.title,
    第10年: y10 && { 岗位: y10.typicalRoles, 城市: y10.cities, 月薪中位数: y10.salary.p50, 生活: y10.lifeDescription },
    一般情况: typical && { 岗位: typical.role, 月薪: typical.year10Salary, 生活质量: typical.lifeQuality },
    典型的一天: path.dayInLife.schedule,
    最喜欢: path.dayInLife.bestPart,
    最难: path.dayInLife.hardestPart,
  };
  const dataStr = JSON.stringify(pathData);
  const choices = path.chosen.length ? path.chosen.map((c) => c.option.label).join(" → ") : "没有特别的选择，走的是这条路最常见的路线";

  const prompt = `你是一位温和、真实的职业故事讲述者。请用第二人称，为一名高中生描绘他走这条路10年后某一天的生活，约150字。
要求：
1. 只能使用下面提供的数据中的数字，不能编造任何数字。
2. 体现他的选择：${choices}
3. 语气真实、具体，有画面感，不要过度美化，也不要制造焦虑。
4. 不要使用"你一定会""成功"这类承诺性的词。
只输出叙述正文。
数据：${dataStr}`;

  const text = await complete(client, prompt, 2048);
  if (!text || !numbersAreGrounded(text, dataStr + choices)) return NextResponse.json(fallback);
  return NextResponse.json({ text, mode: "llm" });
}
