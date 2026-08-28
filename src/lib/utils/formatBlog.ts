import type { BlogDraftOutput } from "@/types/blog";
import { analyzeReferencePatternFit } from "@/lib/reference/blog-patterns";
import { countKeyword } from "./countKeywords";

const riskyWords = ["무조건", "완벽한", "전국 택배 가능", "1위", "최고", "대박"];

export function getSeoCheck(output: BlogDraftOutput, mainKeyword: string) {
  const text = output.plain_text_for_naver;
  const patternCheck = analyzeReferencePatternFit(output);
  const riskCount = riskyWords.filter((word) => text.includes(word)).length;
  const salesWords = ["구매", "주문", "상담", "추천", "선물"].filter((word) =>
    text.includes(word),
  ).length;

  return {
    keyword_count: countKeyword(text, mainKeyword),
    body_length: text.length,
    ad_smell_score: Math.min(100, riskCount * 25 + salesWords * 6),
    pattern_score: patternCheck.pattern_score,
    review_risk_score: patternCheck.review_risk_score,
    mobile_paragraph_score: patternCheck.mobile_paragraph_score,
    warnings: [
      ...(riskCount > 0 ? ["과장처럼 보일 수 있는 표현이 있어요."] : []),
      ...(text.length > 2800 ? ["모바일에서 조금 길게 느껴질 수 있어요."] : []),
      ...(output.selected_products.length !== 2 ? ["본문에서 다룰 제품은 정확히 2개여야 해요."] : []),
      ...patternCheck.warnings.slice(0, 2),
    ],
  };
}

export function sectionLabel(type: string) {
  const labels: Record<string, string> = {
    intro: "도입부",
    empathy: "상황 공감",
    product_recommendation: "제품 추천",
    recommend_list: "이런 분들께 좋아요",
    order_checklist: "주문 체크포인트",
    faq: "FAQ",
    cta: "마무리 CTA",
  };

  return labels[type] ?? type;
}
