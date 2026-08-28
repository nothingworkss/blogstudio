"use client";

import { useState } from "react";
import { Heart, Menu, MessageCircle, Search, Share2 } from "lucide-react";
import type { BlogDraftOutput } from "@/types/blog";

export function MobilePreview({ output }: { output: BlogDraftOutput | null }) {
  const [previewMode, setPreviewMode] = useState<"naver" | "wordpress">("naver");
  const sections = output?.sections ?? [];
  const faq = output?.faq ?? [];
  const hashtags = output?.hashtags ?? [];
  const imageGuide = output?.image_guide ?? [];
  const wordpress = output?.wordpress ?? null;
  const isWordPress = previewMode === "wordpress" && wordpress;

  return (
    <div className="rounded-md border border-[#e8e0d5] bg-white p-4 shadow-[0_12px_30px_rgba(76,56,32,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#38312b]">모바일 미리보기</h2>
          <p className="mt-1 text-[11px] text-[#8a8177]">네이버와 워드프레스 버전을 각각 확인하세요.</p>
        </div>
        <div className="grid grid-cols-2 rounded-md border border-[#ded8ce] bg-[#faf7f0] p-1">
          <button
            type="button"
            className={previewMode === "naver" ? previewActiveClass : previewButtonClass}
            onClick={() => setPreviewMode("naver")}
          >
            네이버
          </button>
          <button
            type="button"
            className={previewMode === "wordpress" ? previewActiveClass : previewButtonClass}
            onClick={() => setPreviewMode("wordpress")}
          >
            워드프레스
          </button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[300px] rounded-[26px] border-[5px] border-[#3c3935] bg-white p-3 shadow-[0_18px_30px_rgba(53,42,31,0.18)]">
        <div className="mb-4 flex items-center justify-between border-b border-[#eee6dc] pb-3">
          <span className={isWordPress ? "text-[15px] font-extrabold text-[#21759b]" : "text-[15px] font-extrabold text-[#29b15f]"}>
            {isWordPress ? "WordPress" : "blog"}
          </span>
          <div className="flex items-center gap-3 text-[#4d463f]">
            <Search className="size-4" />
            <Menu className="size-4" />
          </div>
        </div>
        <article className="max-h-[560px] min-h-[320px] overflow-y-auto pr-1 [scrollbar-width:thin]">
          <h3 className="mb-3 text-[18px] font-extrabold leading-7 text-[#25201c]">
            {isWordPress ? wordpress.selected_title : output?.selected_title ?? "퇴사 답례품, 문구까지 담고 싶다면 이런 쿠키가 좋아요"}
          </h3>
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[#7c7368]">
            <span className={isWordPress ? "grid size-5 place-items-center rounded-full bg-[#d9ecf4]" : "grid size-5 place-items-center rounded-full bg-[#f5d3a4]"}>
              {isWordPress ? "W" : "🍪"}
            </span>
            {isWordPress ? "nothingmatters.com · SEO 초안" : "nothingmatters · 방금 전"}
          </div>
          <div className="mb-3 aspect-[4/2.35] overflow-hidden rounded-md bg-[#f1e3d2]">
            <div className="grid h-full grid-cols-2 gap-1 p-2">
              <div className="rounded-md bg-[radial-gradient(circle_at_45%_45%,#6b3b25_0_22%,#2d1b17_23%_44%,transparent_45%)]" />
              <div className="rounded-md bg-[radial-gradient(circle_at_50%_45%,#e7b35d_0_20%,#bf7b2d_21%_42%,transparent_43%)]" />
            </div>
          </div>
          {output && isWordPress ? (
            <WordPressMobileContent wordpress={wordpress} />
          ) : output ? (
            <NaverMobileContent sections={sections} faq={faq} hashtags={hashtags} imageGuide={imageGuide} />
          ) : (
            <p className="whitespace-pre-line text-[12px] leading-5 text-[#50483f]">
              주제와 메모를 입력하면 모바일 미리보기가 여기에 표시됩니다.
            </p>
          )}
        </article>
        <div className="mt-5 flex items-center justify-between border-t border-[#eee6dc] pt-3 text-[11px] text-[#746a60]">
          <span className="flex items-center gap-1">
            <Heart className="size-4" /> 공감
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-4" /> 댓글
          </span>
          <Share2 className="size-4" />
        </div>
      </div>
    </div>
  );
}

const previewButtonClass = "h-7 rounded px-2 text-[11px] font-bold text-[#786e64] transition hover:bg-white";
const previewActiveClass = "h-7 rounded bg-white px-2 text-[11px] font-bold text-[#ef6759] shadow-[0_1px_4px_rgba(60,45,30,0.08)]";

function NaverMobileContent({
  sections,
  faq,
  hashtags,
  imageGuide,
}: {
  sections: BlogDraftOutput["sections"];
  faq: BlogDraftOutput["faq"];
  hashtags: BlogDraftOutput["hashtags"];
  imageGuide: BlogDraftOutput["image_guide"];
}) {
  return (
    <div className="grid gap-4 pb-2">
      {sections.map((section) => (
        <section key={section.id} className="border-b border-[#f0e8dd] pb-3 last:border-b-0">
          {section.heading ? (
            <h4 className="mb-2 text-[13px] font-extrabold leading-5 text-[#2e2822]">{section.heading}</h4>
          ) : null}
          <p className="whitespace-pre-line text-[12px] leading-5 text-[#50483f]">{section.body}</p>
        </section>
      ))}
      {faq.length ? (
        <section className="border-b border-[#f0e8dd] pb-3">
          <h4 className="mb-2 text-[13px] font-extrabold leading-5 text-[#2e2822]">FAQ</h4>
          <div className="grid gap-2">
            {faq.map((item, index) => (
              <div key={`${item.q}-${index}`} className="rounded-md bg-[#faf6ef] p-2 text-[11px] leading-5 text-[#4a4037]">
                <strong className="block">Q. {item.q}</strong>
                <span>A. {item.a}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {hashtags.length ? (
        <p className="break-words text-[11px] leading-5 text-[#5d7c64]">{hashtags.join(" ")}</p>
      ) : null}
      {imageGuide.length ? (
        <section className="rounded-md bg-[#fff9ef] p-2">
          <h4 className="mb-2 text-[12px] font-extrabold text-[#7a5c2a]">이미지 배치</h4>
          <div className="grid gap-1 text-[10px] leading-4 text-[#7d7267]">
            {imageGuide.map((item, index) => (
              <p key={`${item.position}-${index}`}>
                <strong>{item.position}</strong> · {item.image_type}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function WordPressMobileContent({ wordpress }: { wordpress: NonNullable<BlogDraftOutput["wordpress"]> }) {
  return (
    <div className="grid gap-4 pb-2">
      <section className="rounded-md bg-[#eef7fb] p-2">
        <h4 className="mb-1 text-[12px] font-extrabold text-[#1e6380]">Meta description</h4>
        <p className="text-[11px] leading-5 text-[#4e6570]">{wordpress.meta_description}</p>
      </section>
      {wordpress.excerpt ? (
        <p className="border-b border-[#f0e8dd] pb-3 text-[12px] leading-5 text-[#50483f]">{wordpress.excerpt}</p>
      ) : null}
      {wordpress.sections.map((section) => (
        <section key={section.id} className="border-b border-[#f0e8dd] pb-3 last:border-b-0">
          <h4 className="mb-2 text-[13px] font-extrabold leading-5 text-[#2e2822]">## {section.heading}</h4>
          <p className="whitespace-pre-line text-[12px] leading-5 text-[#50483f]">{section.body}</p>
        </section>
      ))}
      {wordpress.faq.length ? (
        <section className="border-b border-[#f0e8dd] pb-3">
          <h4 className="mb-2 text-[13px] font-extrabold leading-5 text-[#2e2822]">FAQ</h4>
          <div className="grid gap-2">
            {wordpress.faq.map((item, index) => (
              <div key={`${item.q}-${index}`} className="rounded-md bg-[#faf6ef] p-2 text-[11px] leading-5 text-[#4a4037]">
                <strong className="block">### {item.q}</strong>
                <span>{item.a}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="rounded-md bg-[#f4f8f2] p-2">
        <h4 className="mb-2 text-[12px] font-extrabold text-[#497247]">카테고리 / 태그</h4>
        <p className="text-[10px] leading-4 text-[#667261]">카테고리: {wordpress.categories.join(", ")}</p>
        <p className="mt-1 break-words text-[10px] leading-4 text-[#667261]">태그: {wordpress.tags.join(", ")}</p>
      </section>
      {wordpress.image_guide.length ? (
        <section className="rounded-md bg-[#fff9ef] p-2">
          <h4 className="mb-2 text-[12px] font-extrabold text-[#7a5c2a]">이미지 ALT</h4>
          <div className="grid gap-1 text-[10px] leading-4 text-[#7d7267]">
            {wordpress.image_guide.map((item, index) => (
              <p key={`${item.position}-${index}`}>
                <strong>{item.position}</strong>
                <br />
                ALT: {item.alt_text}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
