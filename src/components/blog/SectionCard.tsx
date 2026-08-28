"use client";

import { RefreshCw, Sparkles, WrapText } from "lucide-react";
import type { BlogSection } from "@/types/blog";
import { Button } from "@/components/common/Button";
import { Textarea } from "@/components/common/Textarea";

export function SectionCard({
  section,
  onChange,
  onRegenerate,
}: {
  section: BlogSection;
  onChange: (body: string) => void;
  onRegenerate: (instruction: string) => void;
}) {
  const actions = [
    { label: "다시 쓰기", instruction: "이 섹션 다시 쓰기", icon: <RefreshCw className="size-3.5" /> },
    { label: "짧게", instruction: "더 짧게", icon: <WrapText className="size-3.5" /> },
    { label: "풍성하게", instruction: "더 풍성하게", icon: <Sparkles className="size-3.5" /> },
    { label: "자연스럽게", instruction: "더 자연스럽게", icon: <Sparkles className="size-3.5" /> },
    { label: "판매감 줄이기", instruction: "판매 느낌 줄이기", icon: null },
    { label: "사장님 말투", instruction: "사장님 말투로 바꾸기", icon: null },
    { label: "모바일 줄바꿈", instruction: "모바일용 줄바꿈 적용", icon: null },
  ];

  return (
    <section className="rounded-md border border-[#e5ddd2] bg-white p-3 shadow-[0_1px_2px_rgba(60,45,30,0.03)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[14px] font-bold text-[#362f28]">{section.heading ?? section.id}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.instruction}
              type="button"
              variant="secondary"
              className="h-7 px-2 text-[12px]"
              icon={action.icon}
              onClick={() => onRegenerate(action.instruction)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      <Textarea
        value={section.body}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 border-[#eee7dd] bg-[#fffefd] text-[13px] leading-6"
      />
      <div className="mt-2 text-right text-[11px] text-[#9b9287]">{section.body.length} / 800</div>
    </section>
  );
}
