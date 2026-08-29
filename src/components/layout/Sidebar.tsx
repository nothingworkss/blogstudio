"use client";

import { Archive, Cookie, Gauge, LogOut, PencilLine, Settings } from "lucide-react";
import { clsx } from "clsx";

const items = [
  { key: "dashboard", label: "대시보드", mobileLabel: "홈", icon: Gauge },
  { key: "new", label: "새 글 만들기", mobileLabel: "새 글", icon: PencilLine },
  { key: "drafts", label: "글 보관함", mobileLabel: "보관함", icon: Archive },
  { key: "products", label: "제품/브랜드 설정", mobileLabel: "브랜드", icon: Settings },
];

export type StudioView = "dashboard" | "new" | "editor" | "drafts" | "products";

export function Sidebar({
  activeView,
  onNavigate,
}: {
  activeView: StudioView;
  onNavigate: (view: StudioView) => void;
}) {
  return (
    <aside className="flex w-full min-w-0 max-w-full shrink-0 flex-col border-b border-[#deddd8] bg-white px-3 pb-2 pt-3 lg:sticky lg:top-0 lg:h-screen lg:w-[244px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="mb-3 flex items-center gap-3 px-1 lg:mb-10">
        <div className="grid size-9 place-items-center rounded-[11px] bg-[#18181b] text-white shadow-[0_8px_20px_rgba(24,24,27,0.15)]">
          <Cookie className="size-5" />
        </div>
        <div className="leading-[1.05] text-[#18181b]">
          <div className="text-[15px] font-black tracking-[-0.03em]">nothingmatters</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6f6a]">blog studio</div>
        </div>
      </div>

      <nav aria-label="주요 메뉴" className="grid min-w-0 max-w-full grid-cols-4 gap-1 lg:grid-cols-1 lg:gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const selected =
            activeView === item.key || (activeView === "editor" && item.key === "new");
          return (
            <button
              key={item.key}
              className={clsx(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-2 text-[11px] font-semibold transition-colors duration-200 lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-0 lg:text-left lg:text-[14px]",
                selected
                  ? "bg-[#fff0f3] text-[#b4233f]"
                  : "text-[#65655f] hover:bg-[#f1f0ec] hover:text-[#18181b]",
              )}
              onClick={() => onNavigate(item.key as StudioView)}
            >
              <Icon className="size-[17px]" strokeWidth={selected ? 2.25 : 1.8} />
              <span className="truncate lg:hidden">{item.mobileLabel}</span>
              <span className="hidden truncate lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto hidden gap-2 border-t border-[#ecebe7] pt-4 lg:grid">
        <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#74746e]">
          <span className="size-2 rounded-full bg-[#4bb978]" />
          nothingmatters 작업공간
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-left text-[13px] font-medium text-[#74746e] transition-colors hover:bg-[#f1f0ec] hover:text-[#18181b]"
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
