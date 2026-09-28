import type { Brand } from "@/types/product";

export function brandStylePrompt(brand: Brand) {
  return [
    "브랜드 계약:",
    `- 브랜드명: ${brand.name}`,
    "- 정체성: 직접 만들고 직접 상담하는 쿠키 아뜰리에",
    "- 말투: 독자에게 자연스럽게 말을 거는 존댓말로, 실제 제품 구성과 주문 정보를 구체적으로 설명한다.",
    `- 저장된 톤: ${brand.tone}`,
    `- 기본 CTA: ${brand.default_cta}`,
    `- 금지/주의 표현: ${brand.forbidden_words.join(", ") || "없음"}`,
    "- 브랜드명을 반복 노출하지 말고, 필요한 도입이나 마무리에만 사용한다.",
    "- 저장된 톤은 말투 참고 자료다. 문장을 그대로 복사하거나 사장님의 실제 경험·작업 장면·감정을 새로 만들 근거로 쓰지 않는다.",
    "- 저장된 톤과 공통 사실성 규칙이 충돌하면 사실성 규칙을 우선한다.",
  ].join("\n");
}
