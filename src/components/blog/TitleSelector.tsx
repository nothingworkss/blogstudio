"use client";

import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/common/Button";

export function TitleSelector({
  candidates,
  selectedTitle,
  onSelect,
  onRefresh,
}: {
  candidates: string[];
  selectedTitle: string;
  onSelect: (title: string) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#deddd8] bg-white p-4 shadow-[0_2px_12px_rgba(24,24,27,0.03)]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-[#362f28]">제목 후보</h2>
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-2 text-[12px]"
          icon={<RefreshCw className="size-3.5" />}
          onClick={onRefresh}
        >
          새 제목 추천
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        {candidates.map((title, index) => (
          <button
            key={`${title}-${index}`}
            className={clsx(
              "flex min-h-14 items-start gap-2 rounded-[10px] border px-3 py-2.5 text-left text-[12px] leading-5 transition-colors duration-200",
              selectedTitle === title
                ? "border-[#e85464] bg-[#fff1f3] text-[#27272a]"
                : "border-[#deddd8] bg-[#fafaf8] text-[#5f5f5a] hover:border-[#b9b7b0] hover:bg-white",
            )}
            onClick={() => onSelect(title)}
          >
            <span className="font-bold text-[#b4233f]">{index + 1}</span>
            <span>{title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
