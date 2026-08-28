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
    <section className="rounded-md border border-[#e5ddd2] bg-white p-3 shadow-[0_1px_2px_rgba(60,45,30,0.03)]">
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
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
        {candidates.map((title, index) => (
          <button
            key={`${title}-${index}`}
            className={clsx(
              "flex min-h-12 items-start gap-2 rounded-md border px-3 py-2 text-left text-[12px] leading-5 transition",
              selectedTitle === title
                ? "border-[#ef6759] bg-[#fff8f5] text-[#2f2923]"
                : "border-[#e5ddd2] bg-[#fffdf9] text-[#595047] hover:border-[#efb0a8]",
            )}
            onClick={() => onSelect(title)}
          >
            <span className="font-bold text-[#ef6759]">{index + 1}</span>
            <span>{title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
