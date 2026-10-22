"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BranchChoices, MetricKey, UserProfile } from "@/types";
import type { Ending } from "./simulate";
import { randomSeed } from "./simulate";
import { orderToWeights } from "./metrics";

export const DEFAULT_ORDER: MetricKey[] = ["growth", "income", "stability", "workIntensity", "freedom", "aiResilience"];

export const EMPTY_PROFILE: UserProfile = {
  province: "河南",
  inputMode: "rank",
  subjects: ["物理"],
  preferenceTags: [],
  valueWeights: orderToWeights(DEFAULT_ORDER),
  grade: "高三",
};

export const DEMO_PROFILE: UserProfile = {
  province: "河南",
  inputMode: "rank",
  rank: 35000,
  subjects: ["物理", "化学", "生物"],
  preferenceTags: ["喜欢编程", "喜欢逻辑推理", "成长空间"],
  valueWeights: orderToWeights(["growth", "income", "freedom", "aiResilience", "stability", "workIntensity"]),
  grade: "高三",
};

export type RunRecord = { seed: number; ending: Ending; salary: number; percentile: number; choices: Record<string, string>; eventIds: string[] };
export type ChatMessage = { role: "user" | "assistant"; text: string };
export const DEMO_SEED = 400427; // RUN #0427：每个阶段都有事件，结局为一般

type State = {
  profile: UserProfile;
  hasProfile: boolean;
  wizardStep: number;
  valueOrder: MetricKey[];
  branchChoices: BranchChoices;
  compareIds: string[];
  /** 用户手动挑选、需要追加到结果页的路径 */
  pinnedIds: string[];
  reportUnlocked: boolean;
  demoMode: boolean;
  /** 每条路径当前这一次人生的随机种子 */
  seeds: Record<string, number>;
  /** 每条路径活过的每一次人生 */
  runs: Record<string, RunRecord[]>;
  chats: Record<string, ChatMessage[]>;
  /** 结果页需要播放生成动画 */
  introPending: boolean;

  setProfile: (p: Partial<UserProfile>) => void;
  setWizardStep: (n: number) => void;
  setValueOrder: (o: MetricKey[]) => void;
  finishWizard: () => void;
  loadDemo: () => void;
  choose: (pathId: string, nodeId: string, optionId: string) => void;
  /** 回退到某个分叉节点：清除该节点及之后的选择 */
  rewindTo: (pathId: string, nodeIds: string[]) => void;
  resetChoices: (pathId: string) => void;
  toggleCompare: (pathId: string) => void;
  pin: (pathId: string) => void;
  unlockReport: () => void;
  resetAll: () => void;
  ensureSeed: (pathId: string) => number;
  newSeed: (pathId: string) => number;
  recordRun: (pathId: string, run: RunRecord) => void;
  setChat: (pathId: string, messages: ChatMessage[]) => void;
  setIntroPending: (v: boolean) => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: EMPTY_PROFILE,
      hasProfile: false,
      wizardStep: 0,
      valueOrder: DEFAULT_ORDER,
      branchChoices: {},
      compareIds: [],
      pinnedIds: [],
      reportUnlocked: false,
      demoMode: false,
      seeds: {},
      runs: {},
      chats: {},
      introPending: false,

      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setWizardStep: (n) => set({ wizardStep: n }),
      setValueOrder: (o) => set({ valueOrder: o, profile: { ...get().profile, valueWeights: orderToWeights(o) } }),
      finishWizard: () => set({ hasProfile: true, demoMode: false, wizardStep: 0, introPending: true }),
      loadDemo: () =>
        set({
          profile: DEMO_PROFILE,
          valueOrder: ["growth", "income", "freedom", "aiResilience", "stability", "workIntensity"],
          hasProfile: true,
          demoMode: true,
          branchChoices: {},
          compareIds: [],
          pinnedIds: [],
          seeds: { "cs-backend": DEMO_SEED },
          runs: {},
          chats: {},
          introPending: false,
        }),
      choose: (pathId, nodeId, optionId) =>
        set({ branchChoices: { ...get().branchChoices, [pathId]: { ...(get().branchChoices[pathId] ?? {}), [nodeId]: optionId } } }),
      rewindTo: (pathId, nodeIds) => {
        const cur = { ...(get().branchChoices[pathId] ?? {}) };
        nodeIds.forEach((id) => delete cur[id]);
        set({ branchChoices: { ...get().branchChoices, [pathId]: cur } });
      },
      resetChoices: (pathId) => {
        const next = { ...get().branchChoices };
        delete next[pathId];
        set({ branchChoices: next });
      },
      toggleCompare: (pathId) => {
        const ids = get().compareIds;
        if (ids.includes(pathId)) set({ compareIds: ids.filter((i) => i !== pathId) });
        else set({ compareIds: [...ids, pathId].slice(-3) });
      },
      pin: (pathId) => {
        if (!get().pinnedIds.includes(pathId)) set({ pinnedIds: [...get().pinnedIds, pathId] });
      },
      unlockReport: () => set({ reportUnlocked: true }),
      resetAll: () =>
        set({ profile: EMPTY_PROFILE, hasProfile: false, wizardStep: 0, valueOrder: DEFAULT_ORDER, branchChoices: {}, compareIds: [], pinnedIds: [], reportUnlocked: false, demoMode: false, seeds: {}, runs: {}, chats: {}, introPending: false }),
      ensureSeed: (pathId) => {
        const cur = get().seeds[pathId];
        if (cur !== undefined) return cur;
        const seed = randomSeed();
        set({ seeds: { ...get().seeds, [pathId]: seed } });
        return seed;
      },
      newSeed: (pathId) => {
        const seed = randomSeed();
        set({ seeds: { ...get().seeds, [pathId]: seed } });
        return seed;
      },
      recordRun: (pathId, run) => {
        const list = get().runs[pathId] ?? [];
        const key = (r: RunRecord) => `${r.seed}|${JSON.stringify(r.choices)}`;
        if (list.some((r) => key(r) === key(run))) return;
        set({ runs: { ...get().runs, [pathId]: [...list, run] } });
      },
      setChat: (pathId, messages) => set({ chats: { ...get().chats, [pathId]: messages } }),
      setIntroPending: (v) => set({ introPending: v }),
    }),
    { name: "parallel-life" },
  ),
);
