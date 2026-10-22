export type OfferData = { org: string; title: string; position: string; text: string };

export function OfferLetter({ data, name = "同学" }: { data: OfferData; name?: string }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[6px] bg-[#FFFFFF] p-6 text-[#222] shadow-[0_0_40px_rgba(96,112,242,0.18)]">
      <div className="flex items-center justify-between border-b-2 border-[#3B4CCA] pb-3">
        <p className="text-[14px] font-semibold">{data.org}</p>
        <span className="rounded-full border-2 border-[#C0392B] px-2 py-0.5 text-[10px] font-semibold text-[#C0392B]">已签发</span>
      </div>
      <p className="mt-4 text-center text-[18px] font-bold tracking-widest">{data.title}</p>
      <p className="mt-4 text-[13px]">{name}：</p>
      <p className="mt-2 text-[13px] leading-relaxed">{data.text}</p>
      <p className="mt-3 text-[13px]">
        岗位：<span className="font-semibold">{data.position}</span>
      </p>
      <p className="mt-6 text-right text-[12px] text-[#888]">{data.org} 人力资源部</p>
    </div>
  );
}
