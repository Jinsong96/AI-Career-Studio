import type { CareerPath, Major, SchoolTier } from "@/types";
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

// JSON 导入会把字面量拓宽为 string，这里统一断言；结构由 lib/validate.ts 在测试中做运行时校验
export const PATHS = [
  csBackend, csAi, medDoctor, medPharma, finBank, finResearch, lawLawyer, lawCourt,
  chnTeacher, chnMedia, eeGrid, eeNewenergy, psySchool, psyUx, vetPet, vetLivestock,
] as unknown as CareerPath[];

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
