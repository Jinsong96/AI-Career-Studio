export type Source = {
  name: string;
  year: number;
  url?: string;
  confidence: "high" | "medium" | "low" | "demo";
};

export type SchoolTier = "T1" | "T2" | "T3" | "T4" | "T5";
// T1 顶尖985 | T2 985/211 | T3 双一流及省属重点 | T4 普通本科 | T5 高职专科

export type Major = {
  id: string;
  name: string;
  category: string;
  requiredSubjects: string[];
  tags: string[];
  duration: number;
  pathIds: string[];
};

export type SalaryRange = {
  p10: number;
  p50: number;
  p90: number; // 月薪（元，税前）
  source: Source;
};

export type LifeMetrics = {
  // 0-100 分
  income: number;
  stability: number;
  freedom: number;
  workIntensity: number; // 越高越累，雷达图中反向显示为"工作生活平衡"
  growth: number;
  aiResilience: number;
};

export type MetricKey = keyof LifeMetrics;

export type Stage = {
  label: string;
  yearsAfterGrad: number;
  typicalRoles: string[];
  salary: SalaryRange;
  cities: string[];
  lifeDescription: string;
};

export type Scenario = {
  type: "ideal" | "typical" | "worst";
  percentileLabel: string;
  year10Salary: number;
  role: string;
  lifeQuality: string;
  howPeopleGetHere: string[];
  pivotOptions?: string[];
};

export type ScheduleItem = {
  time: string;
  activity: string;
  mood?: "focus" | "social" | "tired" | "happy" | "stress";
};

export type DayInLife = {
  persona: string;
  schedule: ScheduleItem[];
  bestPart: string;
  hardestPart: string;
  source: Source;
};

export type BranchOption = {
  id: string;
  label: string;
  description: string;
  metricsDelta: Partial<LifeMetrics>;
  salaryMultiplier: number;
  stageOverrides?: Partial<Stage>[];
  tradeoff: string;
};

export type BranchNode = {
  id: string;
  atStage: string;
  question: string;
  options: BranchOption[];
};

export type ChapterId = "prologue" | "y1" | "y3" | "grad" | "w3" | "w5" | "w10" | "epilogue";

export type LifeEvent = {
  id: string;
  stage: "university" | "graduation" | "year3" | "year5" | "year10";
  title: string;
  description: string; // 场景化描述，30到60字
  probability: number; // 0-1，Demo 阶段为示例值
  percentileShift: number; // 对最终收入百分位的影响
  metricsDelta?: Partial<LifeMetrics>;
  tone: "positive" | "neutral" | "challenge";
  copingTip?: string; // challenge 类事件必须有
  source: Source;
};

export type ArtifactType = "moments" | "chat" | "payslip" | "calendar" | "offer";

/** 数字字段只填数据引用的键名（如 "stages[0].salary.p50"），渲染时再读取数值 */
export type Artifact = {
  chapter: ChapterId;
  type: ArtifactType;
  data: Record<string, unknown>;
};

export type FutureSelfQuestion = "regret" | "tired" | "college" | "again" | "life";

export type CareerPath = {
  id: string;
  majorId: string;
  title: string;
  tagline: string;
  tags: string[];
  tierFit: SchoolTier[];
  tierNotes: Record<SchoolTier, string>;
  university: {
    coreCourses: string[];
    hardestCourses: string[];
    pressureLevel: 1 | 2 | 3 | 4 | 5;
    switchMajorDifficulty: string;
    postgradRate: string;
    abroadRate: string;
    yearByYear: { year: number; description: string }[];
    source: Source;
  };
  graduation: {
    destinations: { label: string; percent: number }[];
    source: Source;
  };
  stages: Stage[];
  scenarios: Scenario[];
  dayInLife: DayInLife;
  aiRisk: {
    replaceableTasks: string[];
    resilientTasks: string[];
    skillsToBuild: string[];
    summary: string;
  };
  metrics: LifeMetrics;
  branches: BranchNode[];
  highSchoolPrep: string[];
  /** 海报上展示的"最有特点的典型一天片段"，缺省时取日程中间一项 */
  posterMoment?: string;
  events: LifeEvent[];
  artifacts: Artifact[];
  /** 无 Key 时的场景文字模板，占位符见 lib/story.ts */
  storyChapters: { chapter: ChapterId; template: string }[];
  futureSelfFAQ: Record<FutureSelfQuestion, string>;
  /** 同学群聊里这条路径的人会说的一句近况 */
  reunionLine: string;
};

export type UserProfile = {
  province: string;
  inputMode: "rank" | "score" | "skip";
  rank?: number;
  score?: number;
  subjects: string[];
  preferenceTags: string[];
  freeText?: string;
  valueWeights: Record<MetricKey, number>;
  grade: "高一" | "高二" | "高三";
};

/** pathId → (branchNodeId → optionId) */
export type BranchChoices = Record<string, Record<string, string>>;
