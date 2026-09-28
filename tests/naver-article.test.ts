import { describe, expect, it } from "vitest";
import type { BlogDraftInput } from "@/types/blog";
import { seedBrand, seedProducts } from "@/lib/data/seed";
import { fallbackGenerateBlog, fallbackSelectProducts } from "@/lib/ai/fallbacks";
import { applyEditorialProductSections } from "@/lib/product/editorial";
import { applySeoSectionHeadings } from "@/lib/utils/seoHeadings";
import { formatPlainTextForNaver } from "@/lib/utils/copyFormat";

const input: BlogDraftInput = {
  topic: "진짜 비행기를 쿠키로 만들었습니다",
  main_keyword: "비행기 쿠키",
  sub_keywords: ["비행기 버터쿠키", "여행 선물"],
  target_reader: "비행기 모양 쿠키를 찾는 사람",
  situation: "여행 전 작은 쿠키 선물을 찾는 상황",
  raw_memo: "추천 제목: 진짜 비행기를 쿠키로 만들었습니다. 대표 제품: SNS쿠키.",
  post_type: "클러스터 연결 글",
  reference_style: "검색 유입 정보형",
  preferred_products: ["SNS쿠키 (비행기 버터쿠키)", "쿠키크루 (COOKIE CREW)"],
  product_detail_answers: {},
  cta: "",
  images: [],
};

describe("Naver reader copy", () => {
  it("uses the actual products and avoids internal labels or repetitive sections", () => {
    const selectedProducts = fallbackSelectProducts(input, seedProducts);
    const article = fallbackGenerateBlog({ input, brand: seedBrand, selectedProducts, observations: [], products: seedProducts });
    const productCopy = article.sections.filter((section) => section.type === "product_recommendation")
      .map((section) => section.body).join("\n");

    expect(article.sections).toHaveLength(5);
    expect(article.naver_source).toBe("template");
    expect(article.sections.map((section) => section.type)).toEqual(["intro", "product_recommendation", "product_recommendation", "order_checklist", "cta"]);
    expect(article.sections[0].body).toContain("비행기 버터쿠키");
    expect(productCopy).toContain("한 개씩 나눠 챙기실 건가요?");
    expect(productCopy).toContain("마그넷도 궁금하신가요?");
    expect(productCopy).toContain("하늘·구름");
    expect(productCopy).toContain("마그넷");
    expect(article.plain_text_for_naver).not.toMatch(/사장님한마디|건네는 장면부터 보기|받는 사람\n|추천 제목:|공감댓글|품질\/SEO/);
    expect(article.hashtags).toHaveLength(10);
    expect(article.hashtags.every((tag) => !tag.includes("진짜비행기를쿠키로만들었습니다"))).toBe(true);
  });

  it("preserves a written product paragraph and heading during normalization", () => {
    const selectedProducts = fallbackSelectProducts(input, seedProducts);
    const article = fallbackGenerateBlog({ input, brand: seedBrand, selectedProducts, observations: [], products: seedProducts });
    const custom = {
      ...article,
      sections: article.sections.map((section, index) => index === 1
        ? { ...section, heading: "#### 한 개씩 포장한 비행기 쿠키", body: "**비행기 모양 쿠키** 한 개가 하늘과 구름 그래픽 포장에 들어 있어요." }
        : section),
    };
    const normalized = applySeoSectionHeadings(applyEditorialProductSections(custom, input), input);

    expect(normalized.sections[1].heading).toBe("한 개씩 포장한 비행기 쿠키");
    expect(normalized.sections[1].body).toBe("**비행기 모양 쿠키** 한 개가 하늘과 구름 그래픽 포장에 들어 있어요.");
    expect(formatPlainTextForNaver(normalized)).toContain("비행기 모양 쿠키 한 개가");
    expect(formatPlainTextForNaver(normalized)).not.toContain("####");
  });
});
