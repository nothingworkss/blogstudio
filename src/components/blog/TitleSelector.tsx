"use client";

import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/common/Button";
import { getTitleWarnings, titleCandidateLabels, type TitleChannel } from "@/lib/title-workflow";
import type { TitleEvaluationRecord } from "@/types/blog";

export function TitleSelector({
  channel,
  mainKeyword,
  candidates,
  evaluations = [],
  selectedTitle,
  onSelect,
  onRefresh,
}: {
  channel: TitleChannel;
  mainKeyword: string;
  candidates: string[];
  evaluations?: TitleEvaluationRecord[];
  selectedTitle: string;
  onSelect: (title: string) => void;
  onRefresh: () => void;
}) {
  const channelLabel = channel === "naver" ? "네이버" : "워드프레스";
  const labels = titleCandidateLabels[channel];

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#deddd8] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#ecebe7] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-bold text-[#362f28]">{channelLabel} 제목 후보</h2>
          <p className="mt-1 text-[12px] leading-5 text-[#6f6f6a]">후보의 역할과 경고를 보고 한 제목을 고르세요. 선택 뒤에도 직접 수정할 수 있습니다.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 shrink-0 px-2 text-[12px]"
          icon={<RefreshCw className="size-3.5" />}
          onClick={onRefresh}
        >
          기본 후보 다시 만들기
        </Button>
      </div>
      <div className="divide-y divide-[#ecebe7]">
        {candidates.map((title, index) => {
          const selected = selectedTitle === title;
          const warnings = getTitleWarnings(title, mainKeyword, channel);
          const evaluation = evaluations.find((item) => item.title === title);
          const score = evaluation
            ? Math.round((evaluation.search_intent_score + evaluation.click_appeal_score + evaluation.naturalness_score + evaluation.keyword_fit_score) / 4)
            : null;
          return (
            <button
              key={`${title}-${index}`}
              type="button"
              aria-pressed={selected}
              className={clsx(
                "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b4233f] sm:px-5",
                selected ? "bg-[#fff1f3]" : "hover:bg-[#fafaf8]",
              )}
              onClick={() => onSelect(title)}
            >
              <span className={clsx(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                selected ? "bg-[#b4233f] text-white" : "bg-[#ecebe7] text-[#62625d]",
              )}>
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#8a4b5a]">
                  {evaluation?.type ?? labels[index] ?? "제목 후보"}
                  {score !== null ? <span className="rounded-full bg-[#f1f0ec] px-1.5 py-0.5 text-[#5f5f5a]">종합 {score}/10</span> : null}
                </span>
                <strong className="mt-1 block text-[13px] leading-5 text-[#27272a]">{title}</strong>
                {evaluation?.reason ? <span className="mt-1.5 block text-[11px] leading-4 text-[#6f6f6a]">{evaluation.reason}</span> : null}
                <span className={clsx(
                  "mt-1.5 block text-[11px] leading-4",
                  warnings.length ? "text-[#a16207]" : "text-[#287845]",
                )}>
                  {warnings.length ? warnings[0] : "키워드·길이·표현 기준 통과"}
                </span>
              </span>
              {selected ? <span className="mt-1 text-[11px] font-bold text-[#b4233f]">선택됨</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
