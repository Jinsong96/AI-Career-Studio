import { Heart } from "lucide-react";
import { Avatar } from "./shared";

export type MomentsData = { author: string; text: string; images: string[]; time: string; likes: string[] };

const GRADIENTS = ["linear-gradient(135deg,#3B4CCA,#8B5CF6)", "linear-gradient(135deg,#FF8A3D,#F43F5E)", "linear-gradient(135deg,#10B981,#3B82F6)", "linear-gradient(135deg,#F59E0B,#EC4899)"];

export function MomentsPost({ data }: { data: MomentsData }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[18px] bg-[#FFFFFF] p-4 shadow-[0_0_40px_rgba(96,112,242,0.18)]">
      <div className="flex gap-3">
        <Avatar name={data.author} me={data.author === "我"} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[#576B95]">{data.author === "我" ? "我" : data.author}</p>
          <p className="mt-1 text-[15px] leading-snug text-[#111]">{data.text}</p>
          <div className="mt-2 grid w-[180px] grid-cols-2 gap-1">
            {data.images.map((e, i) => (
              <span key={i} className="flex aspect-square items-center justify-center rounded text-3xl" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                {e}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[#999]">{data.time}</p>
          {data.likes.length > 0 && (
            <p className="mt-2 flex items-start gap-1 rounded bg-[#F7F7F7] px-2 py-1.5 text-[13px] text-[#576B95]">
              <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {data.likes.join("，")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
