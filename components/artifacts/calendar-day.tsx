import type { DayInLife } from "@/types";

const MOOD_DOT: Record<string, string> = { focus: "#3B4CCA", social: "#3B82F6", tired: "#9CA3AF", happy: "#10B981", stress: "#F59E0B" };

export function CalendarDay({ label, day }: { label: string; day: DayInLife }) {
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[18px] bg-[#FFFFFF] text-[#111] shadow-[0_0_40px_rgba(96,112,242,0.18)]">
      <div className="border-b border-[#eee] px-4 py-3">
        <p className="text-[12px] font-medium text-[#FF3B30]">{label}</p>
        <p className="text-[13px] text-[#888]">{day.persona}</p>
      </div>
      <ul className="px-2 py-2">
        {day.schedule.map((s, i) => (
          <li key={i} className="flex gap-3 px-2 py-1.5">
            <span className="w-11 shrink-0 font-mono text-[12px] text-[#888]">{s.time}</span>
            <span className="flex-1 rounded-md px-2 py-1 text-[13px]" style={{ background: `${MOOD_DOT[s.mood ?? "focus"]}1A`, borderLeft: `3px solid ${MOOD_DOT[s.mood ?? "focus"]}` }}>
              {s.activity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
