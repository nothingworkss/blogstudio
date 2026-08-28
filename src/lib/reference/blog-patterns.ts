import type { BlogDraftOutput, ReferenceStyle } from "@/types/blog";

type ReferencePattern = {
  id: ReferenceStyle;
  label: string;
  intent: string;
  titlePattern: string;
  introFlow: string[];
  sectionFlow: string[];
  enrichers: string[];
  imageFlow: string[];
  safetyRules: string[];
};

export type ReferencePatternCheck = {
  pattern_score: number;
  review_risk_score: number;
  mobile_paragraph_score: number;
  warnings: string[];
};

export const defaultReferenceStyle: ReferenceStyle = "답례품 추천형";

export const referenceStyles: ReferenceStyle[] = [
  "검색 유입 정보형",
  "답례품 추천형",
  "시즌 선물형",
  "제품 디테일형",
  "작업일기형",
];

export const referencePatternPack: Record<ReferenceStyle, ReferencePattern> = {
  "검색 유입 정보형": {
    id: "검색 유입 정보형",
    label: "검색 유입 정보형",
    intent: "검색자가 실제로 비교하는 기준을 먼저 정리하고, 제품 소개는 뒤에서 자연스럽게 연결한다.",
    titlePattern: "메인 키워드 + 고르는 기준 + 부담 없는 추천 각도",
    introFlow: ["현실 고민 질문", "선택 기준 예고", "오늘 글에서 정리할 범위 안내"],
    sectionFlow: ["고민 상황", "선택 기준 3가지", "제품 2가지 안내", "주문 전 체크", "FAQ", "부드러운 문의 CTA"],
    enrichers: ["가격보다 준비 기준을 설명", "수량과 일정 같은 실무 정보를 먼저 안내", "제품 장점은 검색 의도와 연결"],
    imageFlow: ["대표 구성", "포장 방식", "제품 디테일", "수량감", "문의 전 확인 컷"],
    safetyRules: ["후기처럼 쓰지 않기", "확인되지 않은 배송/가격/혜택 단정 금지", "다른 브랜드 흔적 제거"],
  },
  "답례품 추천형": {
    id: "답례품 추천형",
    label: "답례품 추천형",
    intent: "답례품을 준비하는 사람이 고민하는 수량, 문구, 포장, 전달 방식을 제품 2개로 좁혀준다.",
    titlePattern: "메인 키워드 + 상황 포인트 + 제품 2개 추천",
    introFlow: ["행사 날짜가 정해진 뒤 생기는 고민", "너무 가볍거나 과한 선물을 피하고 싶은 마음", "문구와 포장까지 보는 기준"],
    sectionFlow: ["도입부", "상황 공감", "문구 기준 제품 안내", "담백한 제품 안내", "이런 분들께 좋아요", "주문 전 체크포인트", "FAQ", "마무리 CTA"],
    enrichers: ["문구 예시는 짧게", "제품별 다른 장점 분리", "문의할 때 보내면 좋은 정보 안내"],
    imageFlow: ["완성품 대표컷", "문구가 보이는 디테일", "개별 포장", "여러 개 놓은 수량컷", "마무리 전 전체 구성"],
    safetyRules: ["가짜 고객 반응 금지", "모든 제품 나열 금지", "선물 만족도 단정 금지"],
  },
  "시즌 선물형": {
    id: "시즌 선물형",
    label: "시즌 선물형",
    intent: "시즌/기념일의 분위기와 준비 실무를 함께 다루며 선물감을 높인다.",
    titlePattern: "시즌 키워드 + 받는 사람 + 선물 구성 느낌",
    introFlow: ["시즌이 가까워질 때 생기는 준비 부담", "받는 사람에게 부담스럽지 않은 선물 기준", "사진과 구성으로 보여줄 포인트"],
    sectionFlow: ["시즌 상황", "받는 사람 기준", "제품 2가지 안내", "이런 분들께 좋아요", "주문 전 체크", "FAQ", "마무리"],
    enrichers: ["받는 사람 연령/상황을 구분", "포장과 이미지컷 활용", "행사일 역산 안내"],
    imageFlow: ["시즌 대표컷", "포장 리본/스티커", "개별 전달 컷", "세트 구성", "행사 전 체크 컷"],
    safetyRules: ["아이/고객 반응 지어내기 금지", "인기/대세 단정 금지", "행사 결과 후기처럼 쓰지 않기"],
  },
  "제품 디테일형": {
    id: "제품 디테일형",
    label: "제품 디테일형",
    intent: "제품 자체의 구성, 포장, 선택 옵션, 주문 전 확인점을 차분히 보여준다.",
    titlePattern: "제품명 + 활용 상황 + 확인하면 좋은 포인트",
    introFlow: ["제품을 찾게 되는 상황", "구성/포장/문구를 함께 봐야 하는 이유", "오늘 소개할 디테일 예고"],
    sectionFlow: ["제품 개요", "디테일 포인트", "어울리는 상황", "대안 제품", "주문 전 체크", "FAQ", "마무리"],
    enrichers: ["옵션은 확인된 DB 정보만 사용", "장점과 주의사항을 함께 배치", "비슷한 상황의 대안 제품 1개만 연결"],
    imageFlow: ["제품 클로즈업", "포장 디테일", "옵션 비교", "실제 크기감", "문의용 체크 컷"],
    safetyRules: ["맛/향을 사진만 보고 단정 금지", "미공개 옵션 생성 금지", "가격/배송 단정 금지"],
  },
  "작업일기형": {
    id: "작업일기형",
    label: "작업일기형",
    intent: "사장님이 직접 준비하는 느낌으로 과정과 생각을 보여주되, 후기처럼 꾸미지 않는다.",
    titlePattern: "오늘 작업한 상황 + 제품명 + 작은 제작 포인트",
    introFlow: ["오늘 준비한 상황", "작업하면서 신경 쓴 부분", "사진 순서대로 보여줄 내용"],
    sectionFlow: ["오늘의 작업", "준비 과정", "제품 2개 포인트", "포장/문구 체크", "주문 전 안내", "FAQ", "마무리"],
    enrichers: ["작업자가 확인한 사실만 쓰기", "과정 사진 캡션을 적극 활용", "실패담보다 준비 포인트 중심"],
    imageFlow: ["작업 시작", "디테일 작업", "포장 과정", "완성 구성", "출고 전 확인"],
    safetyRules: ["고객 반응 지어내기 금지", "현장 후기처럼 과장 금지", "사진에 없는 제작 과정 단정 금지"],
  },
};

const forcedSafetyRules = [
  "예제 글 원문 문장을 그대로 쓰거나 비슷하게 변형하지 않는다.",
  "원문에 있던 다른 브랜드명, 작성자 표시, 복사 버튼 문구, 자동 작성 표시를 출력하지 않는다.",
  "후기형 문장처럼 보이더라도 nothingmatters는 직접 만드는 사람이 상황에 맞게 골라주는 글로 쓴다.",
  "전국 택배 가능, 고객 반응, 판매량, 가격 혜택은 사용자가 제공하지 않으면 쓰지 않는다.",
];

const reviewRiskMarkers = [
  "좋아했어요",
  "난리 났",
  "반응이 좋",
  "하객들이 먼저",
  "고객님들이",
  "인증샷",
  "실제 후기",
  "만족도가 높",
];

const externalContentMarkers = [
  "복사 버튼",
  "이웃 추가",
  "본문 기능",
  "자동 작성 표시",
  "외부 스토어",
  "멤버십 혜택",
  "사은품",
];

const exaggeratedClaims = ["전국 택배 가능", "무조건", "완벽", "최고", "대박", "역대급", "100% 만족"];

export function getReferencePattern(style?: ReferenceStyle) {
  return referencePatternPack[style ?? defaultReferenceStyle] ?? referencePatternPack[defaultReferenceStyle];
}

export function referencePatternPrompt(style?: ReferenceStyle) {
  const pattern = getReferencePattern(style);

  return [
    "내부 예제 글 분석에서 원문을 제거하고 남긴 참고 패턴이다. 아래는 구조와 리듬만 참고한다.",
    `참고 스타일: ${pattern.label}`,
    `검색 의도: ${pattern.intent}`,
    `제목 패턴: ${pattern.titlePattern}`,
    `도입 전개: ${pattern.introFlow.join(" -> ")}`,
    `본문 구성: ${pattern.sectionFlow.join(" -> ")}`,
    `풍성화 포인트: ${pattern.enrichers.join(" / ")}`,
    `이미지 배치: ${pattern.imageFlow.join(" / ")}`,
    `스타일별 안전 규칙: ${pattern.safetyRules.join(" / ")}`,
    `공통 안전 규칙: ${forcedSafetyRules.join(" / ")}`,
  ].join("\n");
}

export function referencePatternPayload(style?: ReferenceStyle) {
  const pattern = getReferencePattern(style);
  return {
    style: pattern.label,
    intent: pattern.intent,
    title_pattern: pattern.titlePattern,
    intro_flow: pattern.introFlow,
    section_flow: pattern.sectionFlow,
    enrichers: pattern.enrichers,
    image_flow: pattern.imageFlow,
    safety_rules: [...pattern.safetyRules, ...forcedSafetyRules],
  };
}

export function analyzeReferencePatternFit(output: BlogDraftOutput): ReferencePatternCheck {
  const text = output.plain_text_for_naver;
  const sectionTypes = output.sections.map((section) => section.type);
  const paragraphLengths = text.split(/\n{2,}/).map((paragraph) => paragraph.trim().length).filter(Boolean);
  const longParagraphs = paragraphLengths.filter((length) => length > 260).length;
  const hasCoreFlow =
    sectionTypes.includes("intro") &&
    sectionTypes.includes("empathy") &&
    sectionTypes.filter((type) => type === "product_recommendation").length === 2 &&
    sectionTypes.includes("order_checklist") &&
    sectionTypes.includes("cta");
  const productCountOk = output.selected_products.length === 2;
  const contentBlocks = [
    output.title_candidates.length === 5,
    output.faq.length === 4,
    output.hashtags.length >= 10,
    output.image_guide.length >= 4,
    text.length >= 1400,
  ].filter(Boolean).length;

  const reviewRiskCount = countMarkers(text, reviewRiskMarkers);
  const externalContentCount = countMarkers(text, externalContentMarkers);
  const exaggerationCount = countMarkers(text, exaggeratedClaims);
  const patternScore = Math.min(100, (hasCoreFlow ? 35 : 0) + (productCountOk ? 25 : 0) + contentBlocks * 8);
  const mobileParagraphScore = Math.max(40, 100 - longParagraphs * 12);
  const warnings = [
    ...(hasCoreFlow ? [] : ["도입-공감-제품2개-체크-CTA 구성이 약합니다."]),
    ...(productCountOk ? [] : ["추천 제품은 정확히 2개여야 합니다."]),
    ...(output.image_guide.length >= 4 ? [] : ["이미지 배치 가이드를 4개 이상으로 늘리면 실사용성이 좋아집니다."]),
    ...(longParagraphs ? ["모바일에서 긴 문단이 있어 줄바꿈을 더 넣는 편이 좋습니다."] : []),
    ...(reviewRiskCount ? ["제공되지 않은 후기나 고객 반응처럼 보이는 표현이 있습니다."] : []),
    ...(externalContentCount ? ["예제 글에서 온 듯한 외부 플랫폼/브랜드 흔적을 제거해야 합니다."] : []),
    ...(exaggerationCount ? ["과장 또는 단정 표현을 낮춰야 합니다."] : []),
  ];

  return {
    pattern_score: patternScore,
    review_risk_score: Math.min(100, reviewRiskCount * 30 + externalContentCount * 20 + exaggerationCount * 20),
    mobile_paragraph_score: mobileParagraphScore,
    warnings,
  };
}

export function getReferenceSafetyWarnings(text: string) {
  return [
    ...reviewRiskMarkers
      .filter((marker) => text.includes(marker))
      .map((marker) => `제공되지 않은 후기/반응처럼 보이는 표현이 있습니다: ${marker}`),
    ...externalContentMarkers
      .filter((marker) => text.includes(marker))
      .map((marker) => `예제 글 또는 외부 플랫폼 흔적으로 보이는 표현을 제거하세요: ${marker}`),
  ];
}

function countMarkers(text: string, markers: string[]) {
  return markers.filter((marker) => text.includes(marker)).length;
}
