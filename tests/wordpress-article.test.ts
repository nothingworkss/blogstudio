import { describe, expect, it } from "vitest";
import type { BlogDraftInput } from "@/types/blog";
import { seedProducts } from "@/lib/data/seed";
import { fallbackSelectProducts } from "@/lib/ai/fallbacks";
import { buildWordPressFallback } from "@/lib/content/wordpress-fallback";
import { formatMarkdownForWordPress } from "@/lib/utils/copyFormat";

describe("WordPress reader copy", () => {
  it("uses actual Gimpo gift details without exposing editorial instructions", () => {
    const input: BlogDraftInput = {
      topic: "김포공항 선물·기념품 가이드｜여행 전 들르기 좋은 쿠키 픽업",
      main_keyword: "김포공항 선물·기념품 가이드",
      sub_keywords: ["김포공항 선물", "김포공항 기념품"],
      target_reader: "김포공항에서 여행 전 선물을 찾는 사람",
      situation: "김포공항 근처에서 예약 픽업할 선물",
      raw_memo: "추천 제목: 김포공항 선물 가이드. 대표 제품: 쿠키플라이트. 연결 글 기획 키워드: 김포공항 선물.",
      post_type: "클러스터 대장 글",
      reference_style: "검색 유입 정보형",
      preferred_products: ["쿠키플라이트 (COOKIE FLIGHT)", "쿠키크루 (COOKIE CREW)"],
      product_detail_answers: {},
      cta: "",
      images: [],
    };
    const selectedProducts = fallbackSelectProducts(input, seedProducts);
    const article = buildWordPressFallback({ input, selectedProducts, products: seedProducts });
    const publicCopy = [article.meta_description, article.excerpt, article.markdown_for_wordpress].join("\n");

    expect(selectedProducts.map((product) => product.product_name)).toEqual(input.preferred_products);
    expect(article.focus_keyword).toBe(input.main_keyword);
    expect(article.source).toBe("template");
    expect(article.sections).toHaveLength(5);
    expect(publicCopy).toContain("클래식버터");
    expect(publicCopy).toContain("마그넷");
    expect(publicCopy).toContain("예약 픽업");
    expect(publicCopy).not.toMatch(/추천 제목:|대표 제품:|연결 글 기획|네이버 글|워드프레스용|해시태그|이미지 ALT|<mark|## ##/);
    expect(article.faq.every((item) => !/네이버|워드프레스|해시태그|ALT/.test(item.q))).toBe(true);
    expect(article.image_guide.every((item) => item.alt_text === "")).toBe(true);
  });

  it("does not duplicate Markdown heading markers", () => {
    const input: BlogDraftInput = {
      topic: "김포공항 선물", main_keyword: "김포공항 선물", sub_keywords: [], target_reader: "", situation: "", raw_memo: "",
      post_type: "검색 유입 정보형", reference_style: "검색 유입 정보형", preferred_products: [], product_detail_answers: {}, cta: "", images: [],
    };
    const article = buildWordPressFallback({ input, selectedProducts: fallbackSelectProducts(input, seedProducts), products: seedProducts });
    article.sections[0].heading = "## 1️⃣ 공항 근처 선물";
    article.faq[0].q = "### 어떤 구성이에요?";
    const markdown = formatMarkdownForWordPress(article);
    expect(markdown).toContain("## 공항 근처 선물");
    expect(markdown).toContain("### 어떤 구성이에요?");
    expect(markdown).not.toMatch(/## ##|### ###|1️⃣/);
  });
});
