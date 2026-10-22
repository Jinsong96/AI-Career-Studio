"use client";

import { useStore } from "@/lib/store";
import { COVERED_PROVINCES, PROVINCES } from "@/lib/data";
import { isCoveredProvince } from "@/lib/tier";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

const GRADES: UserProfile["grade"][] = ["高一", "高二", "高三"];
const FIRST = ["物理", "历史"];
const SECOND = ["化学", "生物", "政治", "地理"];

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[44px] cursor-pointer rounded-xl border px-3.5 py-2 text-sm transition-colors duration-200",
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-medium text-neutral-800">{label}</p>
      {children}
      {hint && <div className="mt-1.5 text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}

export function StepBasic() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const early = profile.grade !== "高三";
  const first = profile.subjects.find((s) => FIRST.includes(s));
  const seconds = profile.subjects.filter((s) => SECOND.includes(s));

  // 读取最新状态，避免连续点击时用到旧的闭包值
  const current = () => useStore.getState().profile.subjects;
  const setFirst = (f: string) => setProfile({ subjects: [f, ...current().filter((s) => SECOND.includes(s))] });
  const toggleSecond = (s: string) => {
    const cur = current();
    const curFirst = cur.find((x) => FIRST.includes(x));
    const curSeconds = cur.filter((x) => SECOND.includes(x));
    let next = curSeconds.includes(s) ? curSeconds.filter((x) => x !== s) : [...curSeconds, s];
    if (next.length > 2) next = next.slice(-2);
    setProfile({ subjects: [...(curFirst ? [curFirst] : []), ...next] });
  };

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">基础信息</h1>

      <Field label="年级">
        <div className="flex gap-2">
          {GRADES.map((g) => (
            <Chip
              key={g}
              active={profile.grade === g}
              onClick={() => setProfile({ grade: g, inputMode: g === "高三" && profile.inputMode === "skip" ? "rank" : profile.inputMode })}
              className="flex-1"
            >
              {g}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="省份" hint={!isCoveredProvince(profile.province) ? "Demo 暂未覆盖，按通用规则估算" : undefined}>
        <select
          value={profile.province}
          onChange={(e) => setProfile({ province: e.target.value })}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-900"
        >
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
              {COVERED_PROVINCES.includes(p) ? "" : "（Demo 暂未覆盖，按通用规则估算）"}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={early ? "成绩（可用模考成绩）" : "位次或分数"}
        hint={profile.inputMode === "score" ? "分数换算为估算值" : profile.inputMode === "skip" ? "按 T3 估算" : undefined}
      >
        <div className="mb-2 flex gap-2">
          <Chip active={profile.inputMode === "rank"} onClick={() => setProfile({ inputMode: "rank" })}>
            按位次
          </Chip>
          <Chip active={profile.inputMode === "score"} onClick={() => setProfile({ inputMode: "score" })}>
            {early ? "按模考分数" : "按分数"}
          </Chip>
          {early && (
            <Chip active={profile.inputMode === "skip"} onClick={() => setProfile({ inputMode: "skip" })}>
              暂时跳过
            </Chip>
          )}
        </div>
        {profile.inputMode !== "skip" && (
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              placeholder={profile.inputMode === "rank" ? "例如 35000" : "例如 580"}
              value={(profile.inputMode === "rank" ? profile.rank : profile.score) ?? ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                setProfile(profile.inputMode === "rank" ? { rank: v } : { score: v });
              }}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-12 text-base outline-none focus:border-neutral-900"
            />
            <span className="absolute right-3 top-1/2 -tranneutral-y-1/2 text-xs text-neutral-400">{profile.inputMode === "rank" ? "名" : "分"}</span>
          </div>
        )}
      </Field>

      <Field label="选科">
        <div className="mb-2 flex gap-2">
          {FIRST.map((f) => (
            <Chip key={f} active={first === f} onClick={() => setFirst(f)} className="flex-1">
              {f}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SECOND.map((s) => (
            <Chip key={s} active={seconds.includes(s)} onClick={() => toggleSecond(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}
