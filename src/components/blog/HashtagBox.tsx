"use client";

import { Hash, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";

export function HashtagBox({
  hashtags,
  onChange,
}: {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
}) {
  return (
    <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-bold text-[#362f28]">해시태그</h3>
        <Button type="button" variant="secondary" className="h-7 px-2 text-[12px]" icon={<RefreshCw className="size-3.5" />}>
          정리하기
        </Button>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-[#eee7dd] bg-[#fffefd] px-3 py-2">
        <Hash className="size-4 text-[#9b6b48]" />
        <input
          className="min-h-8 flex-1 bg-transparent text-[13px] outline-none"
          value={hashtags.join(" ")}
          onChange={(event) => onChange(event.target.value.split(/\s+/).filter(Boolean))}
        />
      </div>
      <div className="mt-2 text-right text-[11px] text-[#9b9287]">{hashtags.length} / 30</div>
    </section>
  );
}
