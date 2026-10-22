# 职业平行人生 Demo（ParallelLife）

面向高中生和家长的 AI 职业探索产品演示版。所有数据为示例数据，仅用于演示产品体验。

## 运行

本机的 Node 安装在 `~/.local/node`（没有加入全局 PATH），先执行：

```bash
export PATH=~/.local/node/bin:$PATH
```

```bash
npm install
```

```bash
npm run dev
```

打开 http://localhost:3000 。路演时点右上角「一键演示」，直接进入示例学生（河南，位次35000，物理+化学+生物）的结果页。

## 可选：接入大模型

把 `.env.local.example` 复制为 `.env.local` 并填入 `ANTHROPIC_API_KEY`，即可启用自由文本偏好解析和个性化叙述（模型 `claude-opus-5-5`）。不填 Key 时会自动降级为关键词规则和模板叙述，所有功能照常可用。大模型生成的叙述会经过数字校验：只要出现数据里没有的数字，就退回模板。

## 结构

- `data/`：16 条路径（`paths/*.json`）、专业、标签、院校层次、省份位次阈值。主演示路径为 `cs-backend`
- `lib/tier.ts`：位次/分数 → 院校层次；`lib/matching.ts`：匹配和排序；`lib/branch.ts`：层次系数 + 分叉选择 → 最终的薪资/指标/描述
- `lib/validate.ts`：路径数据的运行时结构校验（JSON 导入无法直接做 TS 字面量校验）
- `app/`：首页、向导、结果、详情（含分叉）、对比、海报、家长报告、两个 API 路由

## 测试

```bash
npm test
```

覆盖层次映射、匹配排序、分叉计算，以及 16 条路径的结构校验。
