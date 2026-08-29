"use client";

import { ChevronDown, RefreshCw, Sparkles, WrapText } from "lucide-react";
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
  const quickActions = [
    { label: "다시 쓰기", instruction: "이 섹션 다시 쓰기", icon: <RefreshCw className="size-3.5" /> },
    { label: "짧게", instruction: "더 짧게", icon: <WrapText className="size-3.5" /> },
    { label: "자연스럽게", instruction: "더 자연스럽게", icon: <Sparkles className="size-3.5" /> },
  ];
  const moreActions = [
    { label: "풍성하게", instruction: "더 풍성하게" },
    { label: "판매감 줄이기", instruction: "판매 느낌 줄이기", icon: null },
    { label: "사장님 말투", instruction: "사장님 말투로 바꾸기", icon: null },
    { label: "모바일 줄바꿈", instruction: "모바일용 줄바꿈 적용", icon: null },
  ];

  return (
    <section className="rounded-[14px] border border-[#deddd8] bg-white p-4 shadow-[0_2px_12px_rgba(24,24,27,0.03)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[14px] font-bold text-[#27272a]">{section.heading ?? section.id}</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {quickActions.map((action) => (
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
          <details className="relative">
            <summary className="flex h-7 list-none items-center gap-1 rounded-[8px] border border-[#deddd8] bg-white px-2 text-[12px] font-semibold text-[#62625d] transition-colors hover:bg-[#f1f0ec]">
              더보기 <ChevronDown className="details-chevron size-3.5" />
            </summary>
            <div className="absolute right-0 top-9 z-10 grid w-36 gap-1 rounded-[10px] border border-[#deddd8] bg-white p-1.5 shadow-[0_14px_36px_rgba(24,24,27,0.14)]">
              {moreActions.map((action) => (
                <button
                  key={action.instruction}
                  type="button"
                  className="rounded-[7px] px-2.5 py-2 text-left text-[12px] font-medium text-[#4f4f4a] transition-colors hover:bg-[#f1f0ec] hover:text-[#18181b]"
                  onClick={() => onRegenerate(action.instruction)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
      <Textarea
        value={section.body}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 border-[#e7e6e1] bg-[#fdfdfc] text-[13px] leading-6"
      />
      <div className="mt-2 text-right text-[11px] text-[#9b9287]">{section.body.length} / 800</div>
    </section>
  );
}
