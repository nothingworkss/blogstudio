"use client";

import type { BlogDraftOutput } from "@/types/blog";
import { Textarea } from "@/components/common/Textarea";

export function FaqEditor({
  faq,
  onChange,
}: {
  faq: BlogDraftOutput["faq"];
  onChange: (faq: BlogDraftOutput["faq"]) => void;
}) {
  return (
    <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
      <h3 className="mb-2 text-[14px] font-bold text-[#362f28]">FAQ</h3>
      <Textarea
        value={faq.map((item) => `Q. ${item.q}\nA. ${item.a}`).join("\n\n")}
        onChange={(event) => {
          const parsed = event.target.value
            .split(/\n\n+/)
            .map((block) => {
              const [qLine = "", aLine = ""] = block.split("\n");
              return {
                q: qLine.replace(/^Q\.\s*/, "").trim(),
                a: aLine.replace(/^A\.\s*/, "").trim(),
              };
            })
            .filter((item) => item.q || item.a);
          onChange(parsed);
        }}
        className="min-h-36"
      />
    </section>
  );
}
