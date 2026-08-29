"use client";

import { ArrowLeft, CheckCircle2, Copy, Eye, Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { StatusPill } from "@/components/common/StatusPill";

export function Header({
  title,
  isDemoMode,
  showBack,
  showNew,
  canPreview,
  canCopy,
  onBack,
  onNew,
  onPreview,
  onCopy,
}: {
  title: string;
  isDemoMode: boolean;
  showBack: boolean;
  showNew: boolean;
  canPreview: boolean;
  canCopy: boolean;
  onBack: () => void;
  onNew: () => void;
  onPreview: () => void;
  onCopy: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 w-full min-w-0 max-w-full flex-col gap-3 border-b border-[#deddd8] bg-white/92 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        {showBack ? (
          <button
            type="button"
            aria-label="대시보드로 돌아가기"
            className="grid size-9 shrink-0 place-items-center rounded-[10px] text-[#65655f] transition-colors hover:bg-[#f1f0ec] hover:text-[#18181b]"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="min-w-0 truncate text-[17px] font-bold tracking-[-0.02em] text-[#18181b]">{title}</h1>
            {isDemoMode ? <StatusPill tone="warning">데모 모드</StatusPill> : null}
          </div>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#6f6f6a]">
            <CheckCircle2 className="size-3.5 text-[#43a66d]" />
            변경 사항 자동 저장
          </span>
        </div>
      </div>

      {showNew || canPreview || canCopy ? (
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        {showNew ? (
          <Button type="button" variant="secondary" className="min-w-0 flex-1 sm:flex-none" icon={<Plus className="size-4" />} onClick={onNew}>
            새 글
          </Button>
        ) : null}
        {canPreview ? (
          <Button type="button" variant="secondary" className="min-w-0 flex-1 sm:flex-none" icon={<Eye className="size-4" />} onClick={onPreview}>
            미리보기
          </Button>
        ) : null}
        {canCopy ? (
          <Button type="button" variant="primary" className="min-w-0 flex-[1.35] sm:flex-none" icon={<Copy className="size-4" />} onClick={onCopy}>
            <span className="sm:hidden">본문 복사</span>
            <span className="hidden sm:inline">네이버 본문 복사</span>
          </Button>
        ) : null}
        </div>
      ) : null}
    </header>
  );
}
