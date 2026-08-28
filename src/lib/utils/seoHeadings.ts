import type { BlogDraftInput } from "@/types/blog";
import type { ProductRecommendation } from "@/types/product";

export function buildSeoSectionHeadings(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  const mainKeyword = cleanKeyword(input.main_keyword || input.topic || "쿠키 선물");
  const keywords = uniqueKeywords([
    ...input.sub_keywords.map(cleanKeyword),
  ]).filter(Boolean);
  const firstProduct = selectedProducts[0]?.product_name || "첫 번째 쿠키";
  const secondProduct = selectedProducts[1]?.product_name || "두 번째 쿠키";

  return [
    seoHeading(mainKeyword, "처음 고를 때 보는 기준"),
    optionalKeywordHeading(keywords[0], "수량과 포장이 고민될 때"),
    `문구가 필요할 때 ${firstProduct}`,
    `선물감이 필요할 때 ${secondProduct}`,
    optionalKeywordHeading(keywords[1], "이런 상황이라면 좋아요"),
    "주문 전 확인하면 좋은 것",
    "문의 전 마지막으로 정리할 점",
  ];
}

export function buildWordPressSectionHeadings(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  const mainKeyword = cleanKeyword(input.main_keyword || input.topic || "쿠키 선물");
  const subKeywords = uniqueKeywords(input.sub_keywords.map(cleanKeyword)).filter(Boolean);
  const firstProduct = selectedProducts[0]?.product_name || "첫 번째 쿠키";
  const secondProduct = selectedProducts[1]?.product_name || "두 번째 쿠키";
  const headings = [
    `${mainKeyword} 선택 전에 먼저 볼 기준`,
    optionalKeywordHeading(subKeywords[0], "수량·일정·문구를 정하는 순서"),
    `${firstProduct}이 편한 상황과 선택 포인트`,
    `${secondProduct}이 편한 상황과 비교 기준`,
    optionalKeywordHeading(subKeywords[1], "두 제품 사이에서 기준을 좁히는 법"),
    "문의 전에 준비할 다섯 가지",
    "날짜와 수량부터 가볍게 정리하기",
  ];
  const prefixes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
  return headings.map((heading, index) => `${prefixes[index]} ${heading}`);
}

export function applySeoSectionHeadings<
  T extends {
    selected_products: ProductRecommendation[];
    sections: Array<{ heading?: string }>;
    wordpress?: { sections: Array<{ heading: string }> };
  },
>(output: T, input: BlogDraftInput): T {
  const headings = buildSeoSectionHeadings(input, output.selected_products);
  const wordpressHeadings = buildWordPressSectionHeadings(input, output.selected_products);
  const sections = output.sections.map((section, index) => ({
    ...section,
    heading: headings[index] ?? section.heading,
  }));

  return {
    ...output,
    sections,
    wordpress: output.wordpress
      ? {
          ...output.wordpress,
          sections: output.wordpress.sections.map((section, index) => ({
            ...section,
            heading: wordpressHeadings[index] ?? section.heading,
          })),
        }
      : output.wordpress,
  } as T;
}

function cleanKeyword(keyword: string) {
  return keyword.replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

function uniqueKeywords(keywords: string[]) {
  return keywords.filter((keyword, index, list) => keyword && list.indexOf(keyword) === index);
}

function seoHeading(keyword: string, phrase: string) {
  return `${keyword}, ${phrase}`.replace(/\s+/g, " ").trim();
}

function optionalKeywordHeading(keyword: string | undefined, phrase: string) {
  return keyword ? seoHeading(keyword, phrase) : phrase;
}
