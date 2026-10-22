import type { CareerPath, SchoolTier } from "@/types";
import { resolvePath } from "./branch";
import { simulate, type SimResult } from "./simulate";

export const MAX_TURNS = 10;

export const PRESET_QUESTIONS = [
  { key: "regret", text: "你后悔吗？" },
  { key: "tired", text: "你每天累吗？" },
  { key: "college", text: "大学时我应该多做什么？" },
  { key: "again", text: "如果重来你会选别的吗？" },
  { key: "life", text: "你现在住在哪、过得怎么样？" },
] as const;

export const OFFLINE_REPLY = "在 Demo 离线模式下，我只能回答上面这些问题哦。";

const DISTRESS = ["不想活", "想死", "自杀", "活着没意思", "撑不下去", "绝望", "没有希望", "伤害自己"];

/** 明显的情绪困扰：温和回应，并建议找信任的大人或拨打心理援助热线 */
export function distressReply(text: string): string | null {
  if (!DISTRESS.some((k) => text.includes(k))) return null;
  return "听起来你现在真的很难受，谢谢你愿意说出来。未来的路有很多种，现在最重要的是你自己。可以先找一个信任的大人、老师或朋友聊聊；如果感觉撑不住，可以拨打心理援助热线 12356。";
}

const ENDING_PHRASE = { ideal: "这一次运气和努力都站在了我这边", typical: "这一次过得不算惊艳，但挺踏实", worst: "这一次经历了一些低谷，也在慢慢爬出来" } as const;

export function openingLine(path: CareerPath, sim: SimResult, choices: Record<string, string>, age: number, city: string): string {
  const picked = path.branches.map((b) => b.options.find((o) => o.id === choices[b.id])?.label).filter(Boolean);
  const choiceText = picked.length ? `当年我选了「${picked.join("」，后来又「")}」。` : "";
  return `嘿，是我，${age}岁的你。我在${city}，现在是${sim.role}。${choiceText}${ENDING_PHRASE[sim.ending]}。想问什么都可以。`;
}

/** 系统提示词：数据全部在服务端根据路径、层次、分叉和种子重新计算 */
export function systemPrompt(path: CareerPath, tier: SchoolTier, choices: Record<string, string>, seed: number, age = 32): string {
  const r = resolvePath(path, tier, choices);
  const sim = simulate(path, tier, choices, seed);
  const pathData = JSON.stringify({
    职业: r.title,
    阶段: r.stages.map((s) => ({ 阶段: s.label, 岗位: s.typicalRoles, 城市: s.cities, 月薪: { 后10: s.salary.p10, 中位数: s.salary.p50, 前10: s.salary.p90 }, 生活: s.lifeDescription })),
    三种情况: r.scenarios.map((s) => ({ 类型: s.type, 岗位: s.role, 第10年月薪: s.year10Salary, 生活质量: s.lifeQuality })),
    典型的一天: { 人物: r.dayInLife.persona, 最喜欢: r.dayInLife.bestPart, 最难: r.dayInLife.hardestPart },
    AI风险: r.aiRisk.summary,
  });
  const branchChoices = JSON.stringify(r.chosen.map((c) => ({ 节点: path.branches.find((b) => b.id === c.nodeId)?.question, 选择: c.option.label, 代价: c.option.tradeoff })));
  const simulationRun = JSON.stringify({ 结局: sim.ending, 第10年岗位: sim.role, 第10年月薪: sim.year10Salary, 百分位: sim.percentile, 经历的事件: sim.triggered.map((e) => e.title) });
  return `你是一名高中生在某个平行人生中${age}岁的自己。你走的路径、做过的选择和经历的事件如下：${pathData}${branchChoices}${simulationRun}
规则：
1. 用第一人称、口语化，像跟过去的自己说话，每次回答不超过120字。
2. 涉及收入、比例等数字时，只能使用上面数据中的数字，不能编造。没有数据就说"这个我说不准"。
3. 真实地说出这条路的好和难，不美化，不制造焦虑，不做"你一定会成功"之类的承诺。
4. 提醒对方：这只是很多种可能中的一种，他的路由他自己走。
5. 如果对方表现出明显的情绪困扰或绝望，温和地回应，并建议他和信任的大人、老师聊聊，或者拨打心理援助热线。
6. 不讨论和这条人生路径无关的话题。`;
}
