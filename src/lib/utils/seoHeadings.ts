import type { BlogDraftInput } from "@/types/blog";
import type { ProductRecommendation } from "@/types/product";
import { deriveContentAngle } from "@/lib/content/angle";

export function buildSeoSectionHeadings(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  const keywords = uniqueKeywords([
    ...input.sub_keywords.map(cleanKeyword),
  ]).filter(Boolean);
  const firstProduct = selectedProducts[0]?.product_name || "첫 번째 쿠키";
  const secondProduct = selectedProducts[1]?.product_name || "두 번째 쿠키";
  const angle = deriveContentAngle(input, selectedProducts);

  return [
    angle.decisionHeading,
    optionalKeywordHeading(keywords[0], angle.decisionAxes[0]),
    productSectionHeading(selectedProducts[0], firstProduct),
    productSectionHeading(selectedProducts[1], secondProduct),
    optionalKeywordHeading(keywords[1], angle.readerHeading),
    angle.checkHeading,
    "문의 전에 마지막으로 정리할 점",
  ];
}

export function buildWordPressSectionHeadings(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  const firstProduct = selectedProducts[0]?.product_name || "첫 번째 쿠키";
  const secondProduct = selectedProducts[1]?.product_name || "두 번째 쿠키";
  const isAirport = /김포공항|공항동|송정역|제주여행/.test([input.topic, input.main_keyword].join(" "));
  const firstShort = firstProduct.replace(/\s*\([^)]*\)/g, "");
  const secondShort = secondProduct.replace(/\s*\([^)]*\)/g, "");
  return [
    isAirport ? "김포공항 근처에서 선물을 챙긴다면" : "선물의 실제 구성부터 살펴보기",
    firstShort.includes("쿠키플라이트") ? "네 가지 맛을 담은 쿠키플라이트" : `${firstShort}의 실제 구성`,
    secondShort.includes("쿠키크루") ? "쿠키와 마그넷을 함께 고르는 쿠키크루" : `${secondShort}의 실제 구성`,
    isAirport ? "공항동 예약 픽업 전에 확인할 것" : "주문 전에 확인할 것",
    "필요한 날짜에 맞춰 준비하기",
  ];
}

export function applySeoSectionHeadings<
  T extends {
    selected_products: ProductRecommendation[];
    sections: Array<{ heading?: string; body?: string }>;
    wordpress?: { sections: Array<{ heading: string }> };
  },
>(output: T, input: BlogDraftInput): T {
  const mainKeyword = cleanKeyword(input.main_keyword || input.topic || "쿠키 선물");
  const headings = buildSeoSectionHeadings(input, output.selected_products);
  const sections = output.sections.map((section, index) => ({
    ...section,
    heading: headings[index] ?? section.heading,
    body: index === 0 && typeof section.body === "string"
      ? ensureKeywordInIntroBody(section.body, mainKeyword)
      : section.body,
  }));

  return {
    ...output,
    sections,
    wordpress: output.wordpress,
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

function productSectionHeading(recommendation: ProductRecommendation | undefined, fallbackName: string) {
  const productName = recommendation?.product_name || fallbackName;
  if (productName.includes("커스텀")) return `${productName}, 문구와 기념 포인트를 보는 기준`;
  if (productName.includes("수제쿠키")) return `${productName}, 포장을 보는 기준`;
  if (productName.includes("행운")) return `${productName}, 가벼운 메시지를 전하는 기준`;
  if (productName.includes("스콘")) return `${productName}, 차분한 선물감을 보는 기준`;
  if (productName.includes("브라우니")) return `${productName}, 수량과 전달 방식을 보는 기준`;
  return `${productName}, 상황에 맞는 선택 기준`;
}

function ensureKeywordInIntroBody(body: string, keyword: string) {
  if (!keyword || body.includes(keyword)) return body;
  const intro = `${keyword}${objectParticle(keyword)} 준비할 때는 누구에게 언제 전할지부터 정하면 제품 기준을 잡기 쉬워요.`;
  return body.trim() ? `${intro}\n\n${body}` : intro;
}

function objectParticle(value: string) {
  const lastChar = value.trim().at(-1);
  if (!lastChar) return "을";
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "을";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}
