const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"];

export function Avatar({ name, size = 36, me }: { name: string; size?: number; me?: boolean }) {
  const c = me ? "#3B4CCA" : COLORS[Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className="flex shrink-0 items-center justify-center rounded-md text-[13px] font-medium text-snow" style={{ width: size, height: size, background: c }}>
      {me ? "我" : Array.from(name)[0]}
    </span>
  );
}

export function PhoneFrame({ title, children, bg = "#EDEDED" }: { title: string; children: React.ReactNode; bg?: string }) {
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[22px] border border-[#2a2f52] shadow-[0_0_40px_rgba(96,112,242,0.18)]" style={{ background: bg }}>
      <div className="flex items-center justify-center border-b border-[#d9d9d9] bg-[#F7F7F7] py-2.5 text-[14px] font-medium text-[#111]">{title}</div>
      {children}
    </div>
  );
}
