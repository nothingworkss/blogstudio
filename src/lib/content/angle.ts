import type { BlogDraftInput } from "@/types/blog";
import type { ProductRecommendation } from "@/types/product";

export type ContentAngleId =
  | "farewell"
  | "children_event"
  | "wedding"
  | "gratitude"
  | "encouragement"
  | "general";

export type ContentAngle = {
  id: ContentAngleId;
  label: string;
  coreQuestion: string;
  introLead: string;
  decisionAxes: string[];
  readerSignals: string[];
  orderChecks: string[];
  decisionHeading: string;
  readerHeading: string;
  checkHeading: string;
  ctaLead: string;
};

export function deriveContentAngle(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[] = [],
): ContentAngle {
  const context = [input.topic, input.main_keyword, input.target_reader, input.situation, input.raw_memo]
    .filter(Boolean)
    .join(" ");
  const base = context.includes("퇴사") || context.includes("마지막 출근")
    ? farewellAngle()
    : /어린이날|어린이집|유치원|아이들?/.test(context)
      ? childrenEventAngle()
      : /결혼|웨딩|하객/.test(context)
        ? weddingAngle()
        : /스승|선생님|어버이|부모님|감사/.test(context)
          ? gratitudeAngle()
          : /응원|시험|수험|졸업|새해/.test(context)
            ? encouragementAngle()
            : generalAngle(input, selectedProducts);

  return {
    ...base,
    orderChecks: unique([...explicitOrderChecks(context), ...base.orderChecks]).slice(0, 5),
  };
}

function farewellAngle(): ContentAngle {
  return {
    id: "farewell",
    label: "마지막 인사 준비",
    coreQuestion: "마지막 인사를 어떤 무게와 방식으로 건넬지",
    introLead: "마지막 출근 전에는 선물 자체보다 어떤 인사를 남길지가 먼저 정리될 때가 많아요.",
    decisionAxes: ["마지막 인사의 무게", "팀원에게 건네는 장면", "개인적인 기억을 남길지"],
    readerSignals: ["팀원에게 부담 없이 인사하고 싶은 분", "마지막 날의 분위기를 너무 무겁게 만들고 싶지 않은 분", "짧지만 기억에 남는 인사를 고민하는 분"],
    orderChecks: ["전달할 사람", "남기고 싶은 인사", "필요한 날짜", "고른 제품"],
    decisionHeading: "마지막 인사를 먼저 정리해 보기",
    readerHeading: "이런 마지막 인사를 준비한다면",
    checkHeading: "마지막 인사 전에 확인할 것",
    ctaLead: "마지막에 어떤 말을 남기고 싶은지부터 알려주시면",
  };
}

function childrenEventAngle(): ContentAngle {
  return {
    id: "children_event",
    label: "아이들 행사 선물",
    coreQuestion: "아이들이 받는 순간과 행사의 분위기에 맞는 구성을 어떻게 고를지",
    introLead: "아이들 행사 선물은 크기보다 받는 순간에 어떤 표정과 분위기가 남는지가 먼저 보일 때가 많아요.",
    decisionAxes: ["아이들이 받는 장면", "행사의 분위기", "캐릭터와 선물감"],
    readerSignals: ["아이들이 바로 알아볼 선물을 찾는 분", "행사 분위기를 가볍고 즐겁게 만들고 싶은 분", "선생님이나 보호자가 나누기 편한 구성을 찾는 분"],
    orderChecks: ["행사 대상", "필요한 날짜", "원하는 캐릭터 또는 구성", "전달 방식"],
    decisionHeading: "아이들이 받는 장면부터 보기",
    readerHeading: "이런 행사 선물을 준비한다면",
    checkHeading: "행사 전에 정리할 것",
    ctaLead: "아이들이 어떤 장면에서 받게 될지 알려주시면",
  };
}

function weddingAngle(): ContentAngle {
  return {
    id: "wedding",
    label: "결혼식 답례 준비",
    coreQuestion: "하객에게 건네는 흐름과 결혼식 분위기에 맞는 답례를 어떻게 고를지",
    introLead: "결혼식 답례는 제품을 고르기 전에 하객에게 어떤 분위기로 건넬지가 먼저 잡히면 선택이 쉬워져요.",
    decisionAxes: ["하객에게 건네는 흐름", "결혼식의 분위기", "답례의 가벼움과 기억점"],
    readerSignals: ["하객에게 부담 없이 감사 인사를 전하고 싶은 분", "예식 분위기와 답례의 결을 맞추고 싶은 분", "전달 흐름을 먼저 정리하고 싶은 분"],
    orderChecks: ["예식 또는 전달 시점", "하객에게 건네는 방식", "답례의 분위기", "고른 제품"],
    decisionHeading: "하객에게 건네는 흐름부터 보기",
    readerHeading: "이런 결혼식 답례를 준비한다면",
    checkHeading: "예식 전에 확인할 것",
    ctaLead: "하객에게 어떤 분위기로 인사를 전하고 싶은지 알려주시면",
  };
}

function gratitudeAngle(): ContentAngle {
  return {
    id: "gratitude",
    label: "감사 선물 준비",
    coreQuestion: "받는 분에게 전할 감사의 결과 선물의 무게를 어떻게 맞출지",
    introLead: "감사 선물은 무엇을 고를지보다 받는 분께 어느 정도의 마음으로 전할지를 먼저 보면 자연스러워요.",
    decisionAxes: ["받는 분과의 거리", "감사의 결", "선물의 무게"],
    readerSignals: ["감사는 전하고 싶지만 부담스럽고 싶지 않은 분", "받는 분의 분위기에 맞는 선물을 찾는 분", "작지만 분명한 마음을 전하고 싶은 분"],
    orderChecks: ["받는 분", "전하고 싶은 마음", "전달할 시점", "고른 제품"],
    decisionHeading: "감사의 결부터 정리해 보기",
    readerHeading: "이런 감사 선물을 준비한다면",
    checkHeading: "감사 인사 전에 확인할 것",
    ctaLead: "받는 분께 어떤 마음을 전하고 싶은지 알려주시면",
  };
}

function encouragementAngle(): ContentAngle {
  return {
    id: "encouragement",
    label: "응원 선물 준비",
    coreQuestion: "응원의 메시지를 얼마나 가볍고 편하게 전할지",
    introLead: "응원 선물은 큰말보다 지금 필요한 마음을 가볍게 건네는 쪽이 더 잘 맞을 때가 있어요.",
    decisionAxes: ["응원할 사람", "전하고 싶은 메시지", "가볍게 건네는 방식"],
    readerSignals: ["응원을 너무 무겁지 않게 전하고 싶은 분", "작은 기분 전환을 선물하고 싶은 분", "짧은 메시지의 방향을 정하고 싶은 분"],
    orderChecks: ["응원할 사람", "전하고 싶은 메시지", "필요한 시점", "고른 제품"],
    decisionHeading: "응원의 무게부터 정리해 보기",
    readerHeading: "이런 응원을 전하고 싶다면",
    checkHeading: "응원을 건네기 전에 확인할 것",
    ctaLead: "어떤 응원을 전하고 싶은지 알려주시면",
  };
}

function generalAngle(input: BlogDraftInput, selectedProducts: ProductRecommendation[]): ContentAngle {
  const reader = input.target_reader.trim() || "받는 사람";
  const firstProduct = selectedProducts[0]?.product_name || "첫 번째 제품";
  const secondProduct = selectedProducts[1]?.product_name || "두 번째 제품";

  return {
    id: "general",
    label: "상황 맞춤 선택",
    coreQuestion: `${reader}에게 맞는 선택을 무엇부터 좁힐지`,
    introLead: "선물을 고를 때는 제품 이름보다 누구에게 어떤 장면으로 전할지가 먼저 보이면 선택이 쉬워져요.",
    decisionAxes: ["받는 사람", "건네는 장면", `${firstProduct}과 ${secondProduct}의 차이`],
    readerSignals: ["누구에게 전할지부터 정리하고 싶은 분", "두 제품 중 더 맞는 쪽을 찾는 분", "선물의 분위기를 먼저 잡고 싶은 분"],
    orderChecks: ["전달할 사람", "필요한 시점", "고른 제품", "확인할 한 가지"],
    decisionHeading: "건네는 장면부터 보기",
    readerHeading: "이런 선물을 준비한다면",
    checkHeading: "결정 전에 확인할 것",
    ctaLead: "누구에게 어떤 장면으로 전할지 알려주시면",
  };
}

function explicitOrderChecks(context: string) {
  const checks: string[] = [];
  if (/수량|인원|몇 명|명에게/.test(context)) checks.push("예상 수량");
  if (/문구|이름|메시지|카드|스티커/.test(context)) checks.push("남기고 싶은 문구");
  if (/포장|박스|리본|개별/.test(context)) checks.push("포장 방식");
  if (/픽업|퀵|배송|전달 방식/.test(context)) checks.push("수령 또는 전달 방식");
  return checks;
}

function unique(items: string[]) {
  return items.filter((item, index) => item && items.indexOf(item) === index);
}
