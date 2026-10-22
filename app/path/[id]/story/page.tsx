"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Gate } from "@/components/common/gate";
import { StoryView } from "@/components/story/story-view";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const q = useSearchParams();
  return <StoryView key={id} id={id} startReplay={q.get("replay") === "1"} />;
}

export default function StoryPage() {
  return (
    <Gate>
      <Suspense>
        <Inner />
      </Suspense>
    </Gate>
  );
}
