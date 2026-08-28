"use client";

import { ArrowLeft, CheckCircle2, Copy, Eye, HelpCircle, Save } from "lucide-react";
import { Button } from "@/components/common/Button";
import { StatusPill } from "@/components/common/StatusPill";

const mobileActionButtonClass =
  "header-action-button";

export function Header({
  title,
  isDemoMode,
  onPreview,
  onSave,
}: {
  title: string;
  isDemoMode: boolean;
  onPreview: () => void;
  onSave: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 w-full min-w-0 max-w-full flex-col gap-2 overflow-x-hidden border-b border-[#e8e0d5] bg-[#fffdf9]/95 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <button className="grid size-8 place-items-center rounded-md text-[#5f574e] hover:bg-[#f6f0e8]">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="min-w-0 text-[16px] font-semibold text-[#2e2924]">{title}</h1>
        <span className="flex items-center gap-1.5 text-[12px] text-[#8a8176]">
          <CheckCircle2 className="size-4 text-[#50b873]" />
          저장됨 10:35
        </span>
        {isDemoMode ? <StatusPill tone="warning">데모 모드</StatusPill> : null}
      </div>

      <div className="header-actions hidden flex-wrap items-center gap-2 sm:flex sm:w-auto sm:max-w-none">
        <Button type="button" variant="secondary" className={mobileActionButtonClass} icon={<Save className="size-4" />} onClick={onSave}>
          <span className="sm:hidden">저장</span>
          <span className="hidden sm:inline">임시 저장</span>
        </Button>
        <Button type="button" variant="secondary" className={mobileActionButtonClass} icon={<Eye className="size-4" />} onClick={onPreview}>
          <span className="sm:hidden">보기</span>
          <span className="hidden sm:inline">미리보기</span>
        </Button>
        <Button type="button" variant="primary" className={mobileActionButtonClass} icon={<Copy className="size-4" />}>
          <span className="sm:hidden">복사</span>
          <span className="hidden sm:inline">네이버 블로그에 복사</span>
        </Button>
        <button className="hidden size-8 place-items-center rounded-full text-[#5f574e] hover:bg-[#f6f0e8] sm:grid">
          <HelpCircle className="size-5" />
        </button>
        <div className="hidden size-10 place-items-center rounded-full bg-[#f2dfd6] text-[13px] font-bold text-[#8e604d] sm:grid">
          nm
        </div>
      </div>
    </header>
  );
}
