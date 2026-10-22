import type { CareerPath, LifeEvent, Major, SchoolTier, Source } from "@/types";
import majorsJson from "@/data/majors.json";
import tagsJson from "@/data/tags.json";
import tiersJson from "@/data/school-tiers.json";
import provinceJson from "@/data/province-rank-map.json";

import csBackend from "@/data/paths/cs-backend.json";
import csAi from "@/data/paths/cs-ai.json";
import medDoctor from "@/data/paths/med-doctor.json";
import medPharma from "@/data/paths/med-pharma.json";
import finBank from "@/data/paths/fin-bank.json";
import finResearch from "@/data/paths/fin-research.json";
import lawLawyer from "@/data/paths/law-lawyer.json";
import lawCourt from "@/data/paths/law-court.json";
import chnTeacher from "@/data/paths/chn-teacher.json";
import chnMedia from "@/data/paths/chn-media.json";
import eeGrid from "@/data/paths/ee-grid.json";
import eeNewenergy from "@/data/paths/ee-newenergy.json";
import psySchool from "@/data/paths/psy-school.json";
import psyUx from "@/data/paths/psy-ux.json";
import vetPet from "@/data/paths/vet-pet.json";
import vetLivestock from "@/data/paths/vet-livestock.json";
import csBackendStory from "@/data/story/cs-backend.json";
import csAiStory from "@/data/story/cs-ai.json";
import medDoctorStory from "@/data/story/med-doctor.json";
import medPharmaStory from "@/data/story/med-pharma.json";
import finBankStory from "@/data/story/fin-bank.json";
import finResearchStory from "@/data/story/fin-research.json";
import lawLawyerStory from "@/data/story/law-lawyer.json";
import lawCourtStory from "@/data/story/law-court.json";
import chnTeacherStory from "@/data/story/chn-teacher.json";
import chnMediaStory from "@/data/story/chn-media.json";
import eeGridStory from "@/data/story/ee-grid.json";
import eeNewenergyStory from "@/data/story/ee-newenergy.json";
import psySchoolStory from "@/data/story/psy-school.json";
import psyUxStory from "@/data/story/psy-ux.json";
import vetPetStory from "@/data/story/vet-pet.json";
import vetLivestockStory from "@/data/story/vet-livestock.json";

const BASE = [
  csBackend, csAi, medDoctor, medPharma, finBank, finResearch, lawLawyer, lawCourt,
  chnTeacher, chnMedia, eeGrid, eeNewenergy, psySchool, psyUx, vetPet, vetLivestock,
];
const STORY: Record<string, unknown> = {
  "cs-backend": csBackendStory, "cs-ai": csAiStory, "med-doctor": medDoctorStory, "med-pharma": medPharmaStory,
  "fin-bank": finBankStory, "fin-research": finResearchStory, "law-lawyer": lawLawyerStory, "law-court": lawCourtStory,
  "chn-teacher": chnTeacherStory, "chn-media": chnMediaStory, "ee-grid": eeGridStory, "ee-newenergy": eeNewenergyStory,
  "psy-school": psySchoolStory, "psy-ux": psyUxStory, "vet-pet": vetPetStory, "vet-livestock": vetLivestockStory,
};

const EVENT_SOURCE: Source = { name: "示例：从业者访谈整理（待替换）", year: 2024, confidence: "demo" };

// 故事数据（事件、物品、章节模板）单独存放在 data/story，加载时合并；事件未写来源时使用默认示例来源
// JSON 导入会把字面量拓宽为 string，这里统一断言；结构由 lib/validate.ts 在测试中做运行时校验
export const PATHS = BASE.map((p) => {
  const story = STORY[p.id] as unknown as Omit<CareerPath, keyof typeof p>;
  return {
    ...p,
    ...story,
    events: (story.events as Partial<LifeEvent>[]).map((e) => ({ source: EVENT_SOURCE, ...e })),
  };
}) as unknown as CareerPath[];

export const MAJORS = majorsJson as Major[];
export const TAG_GROUPS = tagsJson.groups;
export const ALL_TAGS = tagsJson.groups.flatMap((g) => g.tags);
export const TAG_KEYWORDS = tagsJson.keywords as Record<string, string>;
export const TIERS = tiersJson.tiers as { tier: SchoolTier; name: string; salaryFactor: number }[];
export const PROVINCES = provinceJson.provinces;
export const COVERED_PROVINCES = provinceJson.covered;
export const FEATURED_PATH_ID = "cs-backend";

const pathMap = new Map(PATHS.map((p) => [p.id, p]));
const majorMap = new Map(MAJORS.map((m) => [m.id, m]));

export function getPath(id: string): CareerPath | undefined {
  return pathMap.get(id);
}

export function getMajor(id: string): Major | undefined {
  return majorMap.get(id);
}

export function tierName(tier: SchoolTier): string {
  return TIERS.find((t) => t.tier === tier)?.name ?? tier;
}
