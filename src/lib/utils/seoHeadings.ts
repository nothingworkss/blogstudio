import type { BlogDraftInput } from "@/types/blog";
import type { ProductRecommendation } from "@/types/product";

export function buildSeoSectionHeadings(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  const firstProduct = selectedProducts[0]?.product_name || "첫 번째 쿠키";
  const secondProduct = selectedProducts[1]?.product_name || "두 번째 쿠키";
  const isAirport = /김포공항|공항동|송정역|비행기|여행/.test(`${input.topic} ${input.main_keyword}`);

  return [
    isAirport ? "비행기 쿠키, 어떤 구성을 찾으세요?" : "어떤 쿠키를 찾고 계세요?",
    productSectionHeading(selectedProducts[0], firstProduct),
    productSectionHeading(selectedProducts[1], secondProduct),
    isAirport ? "예약 픽업 전에 확인할 것" : "주문 전에 확인할 것",
    "필요한 날짜에 맞춰 준비하기",
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
  const headings = buildSeoSectionHeadings(input, output.selected_products);
  const sections = output.sections.map((section, index) => {
    const heading = cleanNaverSectionHeading(section.heading ?? "");
    return {
      ...section,
      heading: heading && !/^(도입부|상황 공감|제품 추천|마무리)$/.test(heading)
        ? heading
        : headings[index] ?? heading,
    };
  });

  return {
    ...output,
    sections,
    wordpress: output.wordpress,
  } as T;
}

export function cleanNaverSectionHeading(heading: string) {
  return heading.replace(/^\s*(?:#{1,6}\s*)?(?:[1-7](?:️⃣|\.)\s*)?/, "").replace(/^\*\*(.*?)\*\*$/, "$1").trim();
}

function productSectionHeading(recommendation: ProductRecommendation | undefined, fallbackName: string) {
  const productName = recommendation?.product_name || fallbackName;
  if (productName.includes("커스텀")) return `${productName}, 문구와 기념 포인트를 보는 기준`;
  if (productName.includes("수제쿠키")) return `${productName}, 포장을 보는 기준`;
  if (productName.includes("행운")) return `${productName}, 가벼운 메시지를 전하는 기준`;
  if (productName.includes("스콘")) return `${productName}, 차분한 선물감을 보는 기준`;
  if (productName.includes("브라우니")) return `${productName}, 수량과 전달 방식을 보는 기준`;
  return `${productName}의 실제 구성`;
}
