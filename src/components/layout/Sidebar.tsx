"use client";

import { Archive, Cookie, Gauge, LogOut, PencilLine, Settings } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/common/Button";

const items = [
  { key: "dashboard", label: "대시보드", icon: Gauge },
  { key: "new", label: "새 글 만들기", icon: PencilLine },
  { key: "drafts", label: "글 보관함", icon: Archive },
  { key: "products", label: "제품/브랜드 설정", icon: Settings },
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
    <aside className="flex w-full min-w-0 max-w-full shrink-0 flex-col border-b border-[#e8e0d5] bg-[#fffdf9] px-3 py-3 lg:min-h-screen lg:w-[220px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="mb-3 flex items-center gap-3 lg:mb-11">
        <div className="grid size-9 place-items-center rounded-full bg-[#f6d7a8] text-[#5a3421]">
          <Cookie className="size-5" />
        </div>
        <div className="font-serif text-[18px] font-semibold leading-[1.05] text-[#2d2924]">
          <div>nothingmatters</div>
          <div>blog studio</div>
        </div>
      </div>

      <nav className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const Icon = item.icon;
          const selected =
            activeView === item.key || (activeView === "editor" && item.key === "new");
          return (
            <button
              key={item.key}
              className={clsx(
                "flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-left text-[14px] font-medium transition",
                selected
                  ? "bg-[#fff0ed] text-[#ee5c50]"
                  : "text-[#544d44] hover:bg-[#f6f0e8]",
              )}
              onClick={() => onNavigate(item.key as StudioView)}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto hidden gap-2 lg:grid">
        <button className="flex h-11 items-center justify-between rounded-md border border-[#e4dbd0] bg-white px-3 text-[13px] font-medium text-[#544d44]">
          <span className="flex items-center gap-2">
            <Cookie className="size-4 text-[#a86939]" />
            nothingmatters
          </span>
          <span className="text-[#9a9187]">⌄</span>
        </button>
        <Button type="button" variant="secondary" className="justify-start">
          브랜드 사이트 보기
        </Button>
        <button
          className="mt-8 flex h-10 items-center gap-3 rounded-md px-3 text-left text-[13px] font-medium text-[#756c61] hover:bg-[#f6f0e8]"
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
